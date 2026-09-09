package com.danbi.transfer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.danbi.domain.account.entity.Account;
import com.danbi.domain.account.entity.AccountProduct;
import com.danbi.domain.account.entity.AccountStatus;
import com.danbi.domain.account.entity.ProductType;
import com.danbi.domain.account.repository.AccountProductRepository;
import com.danbi.domain.account.repository.AccountRepository;
import com.danbi.domain.help.entity.EventType;
import com.danbi.domain.help.entity.FlowType;
import com.danbi.domain.help.entity.HelpStage;
import com.danbi.domain.help.entity.HelpUserResponse;
import com.danbi.domain.help.entity.UserEvent;
import com.danbi.domain.help.repository.UserEventRepository;
import com.danbi.domain.transaction.entity.ReviewStatus;
import com.danbi.domain.transaction.repository.TransactionRepository;
import com.danbi.domain.transfer.dto.RiskCheckResponse;
import com.danbi.domain.transfer.dto.TransferExecuteRequest;
import com.danbi.domain.transfer.dto.TransferResponse;
import com.danbi.domain.transfer.entity.RiskReason;
import com.danbi.domain.transfer.entity.Transfer;
import com.danbi.domain.transfer.entity.TransferMethod;
import com.danbi.domain.transfer.entity.TransferStatus;
import com.danbi.domain.transfer.exception.TransferBlockedException;
import com.danbi.domain.transfer.repository.TransferRepository;
import com.danbi.domain.transfer.service.TransferService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.assertj.core.api.InstanceOfAssertFactories;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class TransferServiceTest {

	private static final String SESSION = "flow-1";
	private static final String RECIPIENT_ACCOUNT = "333-4444-5555";

	@Autowired
	private TransferService transferService;
	@Autowired
	private AccountRepository accountRepository;
	@Autowired
	private AccountProductRepository accountProductRepository;
	@Autowired
	private TransactionRepository transactionRepository;
	@Autowired
	private TransferRepository transferRepository;
	@Autowired
	private UserEventRepository userEventRepository;

	private Long accountId;
	private Long checkingProductId;

	@BeforeEach
	void setUp() {
		checkingProductId = accountProductRepository.save(product(ProductType.CHECKING)).getProductId();
		accountId = accountRepository.save(account("110-1111-2222", checkingProductId, AccountStatus.ACTIVE))
			.getAccountId();
	}

	private AccountProduct product(ProductType type) {
		return AccountProduct.builder()
			.productName(type.name() + " 상품")
			.productType(type)
			.baseInterestRate(new BigDecimal("1.50"))
			.additionalPaymentAllowed(false)
			.build();
	}

	private Account account(String number, Long productId, AccountStatus status) {
		return Account.builder()
			.userId(1L)
			.product(accountProductRepository.getReferenceById(productId))
			.accountName("주거래 입출금")
			.accountNumber(number)
			.balance(2_000_000L)
			.isPrimary(true)
			.accountStatus(status)
			.build();
	}

	private TransferExecuteRequest requestFrom(Long fromAccountId, long amount, String password, boolean ack) {
		return new TransferExecuteRequest(fromAccountId, null, "088", RECIPIENT_ACCOUNT, "김단비",
			amount, TransferMethod.MANUAL, password, ack, false, false, false, SESSION);
	}

	private TransferExecuteRequest request(long amount, String password, boolean ack) {
		return requestFrom(accountId, amount, password, ack);
	}

	private Transfer completedTransfer(long amount, LocalDateTime completedAt) {
		return transferRepository.save(Transfer.builder()
			.accountId(accountId)
			.recipientBankCode("088")
			.recipientAccountNumber(RECIPIENT_ACCOUNT)
			.recipientName("김단비")
			.amount(amount)
			.transferMethod(TransferMethod.MANUAL)
			.recipientIsNew(false)
			.status(TransferStatus.COMPLETED)
			.requestedAt(completedAt)
			.completedAt(completedAt)
			.build());
	}

	private void recordEvent(EventType type, HelpStage stage, HelpUserResponse response, LocalDateTime at) {
		userEventRepository.save(UserEvent.builder()
			.userId(1L)
			.flowSessionId(SESSION)
			.flowType(FlowType.REAL_TRANSFER)
			.screenCode("SAFETY_CHECK")
			.eventType(type)
			.helpStage(stage)
			.userResponse(response)
			.createdAt(at)
			.build());
	}

	@Test
	void executeHappyPath_decrementsBalanceAndWritesTransactionAndTransfer() {
		// 이 수취인에게 이전에 보낸 적이 있어 위험(신규계좌)이 아닌 상태
		completedTransfer(50_000, LocalDateTime.now().minusDays(2));

		TransferResponse res = transferService.execute(request(80_000, "1234", false));

		assertThat(res.status()).isEqualTo(TransferStatus.COMPLETED);
		assertThat(res.risky()).isFalse();
		assertThat(res.balanceAfter()).isEqualTo(1_920_000L);
		assertThat(accountRepository.findById(accountId).orElseThrow().getBalance()).isEqualTo(1_920_000L);

		assertThat(transactionRepository.findById(res.transactionId()).orElseThrow())
			.satisfies(tx -> {
				assertThat(tx.getAmount()).isEqualTo(80_000L);
				assertThat(tx.getReviewStatus()).isEqualTo(ReviewStatus.PENDING);
			});
		assertThat(transferRepository.findById(res.transferId()).orElseThrow().getStatus())
			.isEqualTo(TransferStatus.COMPLETED);
	}

	@Test
	void execute_wrongPassword_isRejected() {
		assertThatThrownBy(() -> transferService.execute(request(80_000, "0000", false)))
			.asInstanceOf(InstanceOfAssertFactories.type(TransferBlockedException.class))
			.satisfies(e -> {
				assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
				assertThat(e.getCode()).isEqualTo("ACCOUNT_PASSWORD_ERROR");
			});

		assertThat(accountRepository.findById(accountId).orElseThrow().getBalance()).isEqualTo(2_000_000L);
	}

	@Test
	void execute_riskyTransfer_withoutRecordedSafetyCheck_isRejectedEvenWithAck() {
		assertThatThrownBy(() -> transferService.execute(request(1_500_000, "1234", true)))
			.asInstanceOf(InstanceOfAssertFactories.type(TransferBlockedException.class))
			.satisfies(e -> {
				assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT);
				assertThat(e.getCode()).isEqualTo("SAFETY_CHECK_REQUIRED");
				assertThat(e.getReasons()).contains(RiskReason.HIGH_AMOUNT, RiskReason.NEW_RECIPIENT);
			});

		assertThat(accountRepository.findById(accountId).orElseThrow().getBalance()).isEqualTo(2_000_000L);
	}

	@Test
	void execute_riskyTransfer_withCompletedSafetyCheck_succeeds() {
		LocalDateTime base = LocalDateTime.now().minusMinutes(10);
		recordEvent(EventType.RISK_DETECTED, null, null, base);
		recordEvent(EventType.HELP_SHOWN, HelpStage.SAFETY_CHECK, null, base.plusSeconds(30));
		recordEvent(EventType.HELP_RESPONSE, HelpStage.SAFETY_CHECK, HelpUserResponse.SAFETY_CONFIRMED, base.plusSeconds(60));

		TransferResponse res = transferService.execute(request(1_500_000, "1234", true));

		assertThat(res.status()).isEqualTo(TransferStatus.COMPLETED);
		assertThat(res.risky()).isTrue();
		assertThat(accountRepository.findById(accountId).orElseThrow().getBalance()).isEqualTo(500_000L);
	}

	@Test
	void execute_riskyTransfer_afterRiskCheckAndAck_recordsSafetyCheckAndSucceeds() {
		// 프론트 실제 흐름: 같은 flowSession 으로 위험 점검 → 안심확인 팝업 확인(ack) → 송금 실행.
		transferService.riskCheck(accountId, 1_500_000, RECIPIENT_ACCOUNT, false, false, false, false, SESSION);

		TransferResponse res = transferService.execute(request(1_500_000, "1234", true));

		assertThat(res.status()).isEqualTo(TransferStatus.COMPLETED);
		assertThat(res.risky()).isTrue();
		assertThat(accountRepository.findById(accountId).orElseThrow().getBalance()).isEqualTo(500_000L);
		assertThat(userEventRepository.findByFlowSessionIdOrderByCreatedAtAsc(SESSION))
			.anySatisfy(e -> {
				assertThat(e.getEventType()).isEqualTo(EventType.HELP_RESPONSE);
				assertThat(e.getUserResponse()).isEqualTo(HelpUserResponse.SAFETY_CONFIRMED);
			});
	}

	@Test
	void execute_amountExceedsBalance_isBlocked() {
		assertThatThrownBy(() -> transferService.execute(request(9_000_000, "1234", true)))
			.asInstanceOf(InstanceOfAssertFactories.type(TransferBlockedException.class))
			.satisfies(e -> {
				assertThat(e.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
				assertThat(e.getReasons()).contains(RiskReason.AMOUNT_EXCEEDS_BALANCE);
			});
	}

	@Test
	void execute_dormantAccount_isBlockedBeforeAnyMoneyMoves() {
		Long dormant = accountRepository.save(account("220-2222-3333", checkingProductId, AccountStatus.DORMANT))
			.getAccountId();

		assertThatThrownBy(() -> transferService.execute(requestFrom(dormant, 50_000, "1234", false)))
			.asInstanceOf(InstanceOfAssertFactories.type(TransferBlockedException.class))
			.satisfies(e -> {
				assertThat(e.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
				assertThat(e.getCode()).isEqualTo("ACCOUNT_NOT_WITHDRAWABLE");
			});

		assertThat(accountRepository.findById(dormant).orElseThrow().getBalance()).isEqualTo(2_000_000L);
	}

	@Test
	void execute_closedAccount_isBlocked() {
		Long closed = accountRepository.save(account("230-2222-3333", checkingProductId, AccountStatus.CLOSED))
			.getAccountId();

		assertThatThrownBy(() -> transferService.execute(requestFrom(closed, 50_000, "1234", false)))
			.asInstanceOf(InstanceOfAssertFactories.type(TransferBlockedException.class))
			.satisfies(e -> assertThat(e.getCode()).isEqualTo("ACCOUNT_NOT_WITHDRAWABLE"));
	}

	@Test
	void execute_savingsProductAccount_isBlocked() {
		Long savingsProductId = accountProductRepository.save(product(ProductType.FIXED_SAVINGS)).getProductId();
		Long savings = accountRepository.save(account("240-2222-3333", savingsProductId, AccountStatus.ACTIVE))
			.getAccountId();

		assertThatThrownBy(() -> transferService.execute(requestFrom(savings, 50_000, "1234", false)))
			.asInstanceOf(InstanceOfAssertFactories.type(TransferBlockedException.class))
			.satisfies(e -> {
				assertThat(e.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
				assertThat(e.getCode()).isEqualTo("ACCOUNT_NOT_WITHDRAWABLE");
			});
	}

	@Test
	void riskCheck_flagsInCallAndRushedAndPhishing() {
		RiskCheckResponse res = transferService.riskCheck(accountId, 50_000, RECIPIENT_ACCOUNT,
			false, true, true, true, SESSION);

		assertThat(res.risky()).isTrue();
		assertThat(res.blocked()).isFalse();
		assertThat(res.reasons()).contains(
			RiskReason.IN_CALL, RiskReason.RUSHED, RiskReason.PHISHING_KEYWORD_DETECTED, RiskReason.NEW_RECIPIENT);
	}

	@Test
	void riskCheck_repeatedTransfer_flaggedAfterTwoRecentCompleted() {
		completedTransfer(10_000, LocalDateTime.now().minusHours(1));
		completedTransfer(10_000, LocalDateTime.now().minusHours(2));

		RiskCheckResponse res = transferService.riskCheck(accountId, 10_000, RECIPIENT_ACCOUNT,
			false, false, false, false, SESSION);

		assertThat(res.reasons()).contains(RiskReason.REPEATED_TRANSFER);
		assertThat(res.recipientIsNew()).isFalse();
	}

	@Test
	void riskCheck_dormantAccount_isBlockedWithSameCriteria() {
		Long dormant = accountRepository.save(account("250-2222-3333", checkingProductId, AccountStatus.DORMANT))
			.getAccountId();

		assertThatThrownBy(() -> transferService.riskCheck(dormant, 50_000, RECIPIENT_ACCOUNT,
			false, false, false, false, SESSION))
			.asInstanceOf(InstanceOfAssertFactories.type(TransferBlockedException.class))
			.satisfies(e -> assertThat(e.getCode()).isEqualTo("ACCOUNT_NOT_WITHDRAWABLE"));
	}
}
