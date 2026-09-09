package com.danbi.domain.transfer.service;

import com.danbi.domain.account.entity.Account;
import com.danbi.domain.account.entity.AccountProduct;
import com.danbi.domain.account.entity.AccountStatus;
import com.danbi.domain.account.entity.ProductType;
import com.danbi.domain.account.repository.AccountProductRepository;
import com.danbi.domain.account.repository.AccountRepository;
import com.danbi.domain.help.entity.FlowType;
import com.danbi.domain.help.service.HelpService;
import com.danbi.domain.transaction.entity.ReviewStatus;
import com.danbi.domain.transaction.entity.Transaction;
import com.danbi.domain.transaction.entity.TransactionType;
import com.danbi.domain.transaction.repository.TransactionRepository;
import com.danbi.domain.transfer.dto.AccountHolderResponse;
import com.danbi.domain.transfer.dto.BankResponse;
import com.danbi.domain.transfer.dto.RiskCheckResponse;
import com.danbi.domain.transfer.dto.SaveRecipientRequest;
import com.danbi.domain.transfer.dto.SavedRecipientResponse;
import com.danbi.domain.transfer.dto.TransferExecuteRequest;
import com.danbi.domain.transfer.dto.TransferResponse;
import com.danbi.domain.transfer.entity.Bank;
import com.danbi.domain.transfer.entity.RiskReason;
import com.danbi.domain.transfer.entity.SavedRecipient;
import com.danbi.domain.transfer.entity.Transfer;
import com.danbi.domain.transfer.entity.TransferStatus;
import com.danbi.domain.transfer.exception.TransferBlockedException;
import com.danbi.domain.transfer.repository.SavedRecipientRepository;
import com.danbi.domain.transfer.repository.TransferRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransferService {

	private static final long REPEATED_TRANSFER_WINDOW_HOURS = 24;
	private static final long REPEATED_TRANSFER_MIN_COUNT = 2;
	private static final int RECENT_RECIPIENT_LIMIT = 30;
	private static final String SAFETY_CHECK_SCREEN = "SAFETY_CHECK";
	private static final String[] MOCK_NAMES = {
		"김민준", "이서연", "박도윤", "최지우", "정하준", "강서아", "조은우", "윤지호"
	};

	private final AccountRepository accountRepository;
	private final AccountProductRepository accountProductRepository;
	private final TransactionRepository transactionRepository;
	private final TransferRepository transferRepository;
	private final SavedRecipientRepository savedRecipientRepository;
	private final HelpService helpService;

	@Value("${danbi.transfer.demo-password:1234}")
	private String demoPassword;

	@Value("${danbi.transfer.high-amount-threshold:1000000}")
	private long highAmountThreshold;

	/** 예금주 조회(목업). 저장 수취인 → 과거 송금 → 계좌번호 기반 임의 이름 순. */
	public AccountHolderResponse lookupAccountHolder(String bankCode, String accountNumber) {
		if (!isValidAccountNumber(accountNumber)) {
			throw new TransferBlockedException(HttpStatus.UNPROCESSABLE_CONTENT, "ACCOUNT_NUMBER_INVALID",
				"계좌번호 형식이 올바르지 않습니다.", List.of(RiskReason.ACCOUNT_NUMBER_INVALID));
		}
		return savedRecipientRepository
			.findFirstByRecipientBankCodeAndRecipientAccountNumber(bankCode, accountNumber)
			.map(s -> new AccountHolderResponse(bankCode, accountNumber, s.getRecipientName(), true))
			.or(() -> transferRepository
				.findFirstByRecipientBankCodeAndRecipientAccountNumberOrderByRequestedAtDesc(bankCode, accountNumber)
				.map(t -> new AccountHolderResponse(bankCode, accountNumber, t.getRecipientName(), false)))
			.orElseGet(() -> new AccountHolderResponse(bankCode, accountNumber, mockRecipientName(accountNumber), false));
	}

	/** 저장 수취인 + 최근 송금계좌 통합 목록. */
	public List<SavedRecipientResponse> getRecipients(Long userId) {
		List<SavedRecipient> saved = savedRecipientRepository.findByUserIdOrderBySavedRecipientIdDesc(userId);

		List<SavedRecipientResponse> result = new ArrayList<>();
		Set<String> seen = new LinkedHashSet<>();
		for (SavedRecipient s : saved) {
			if (seen.add(recipientKey(s.getRecipientBankCode(), s.getRecipientAccountNumber()))) {
				result.add(SavedRecipientResponse.fromSaved(s));
			}
		}

		List<Long> accountIds = accountRepository.findByUserId(userId).stream()
			.map(Account::getAccountId)
			.toList();
		if (!accountIds.isEmpty()) {
			List<Transfer> recents = transferRepository
				.findTop30ByAccountIdInAndStatusOrderByCompletedAtDesc(accountIds, TransferStatus.COMPLETED);
			int added = 0;
			for (Transfer t : recents) {
				if (added >= RECENT_RECIPIENT_LIMIT) {
					break;
				}
				if (seen.add(recipientKey(t.getRecipientBankCode(), t.getRecipientAccountNumber()))) {
					result.add(SavedRecipientResponse.fromRecentTransfer(t));
					added++;
				}
			}
		}
		return result;
	}

	/** 은행 선택 목록. */
	public List<BankResponse> listBanks() {
		return Arrays.stream(Bank.values()).map(BankResponse::from).toList();
	}

	/** 송금 단건 조회. */
	public TransferResponse getTransfer(Long transferId) {
		return transferRepository.findById(transferId)
			.map(TransferResponse::from)
			.orElseThrow(() -> new TransferBlockedException(HttpStatus.NOT_FOUND, "TRANSFER_NOT_FOUND",
				"송금 내역을 찾을 수 없습니다.", List.of()));
	}

	/** 저장 수취인 추가. 같은 계좌가 이미 있으면 이름/별칭만 갱신한다. */
	@Transactional
	public SavedRecipientResponse addSavedRecipient(SaveRecipientRequest req) {
		SavedRecipient recipient = savedRecipientRepository
			.findFirstByUserIdAndRecipientBankCodeAndRecipientAccountNumber(
				req.userId(), req.recipientBankCode(), req.recipientAccountNumber())
			.map(existing -> {
				existing.updateLabels(req.recipientName(), req.nickname());
				return existing;
			})
			.orElseGet(() -> SavedRecipient.builder()
				.userId(req.userId())
				.recipientBankCode(req.recipientBankCode())
				.recipientAccountNumber(req.recipientAccountNumber())
				.recipientName(req.recipientName())
				.nickname(req.nickname())
				.build());
		return SavedRecipientResponse.fromSaved(savedRecipientRepository.save(recipient));
	}

	/** 저장 수취인 삭제. */
	@Transactional
	public void deleteSavedRecipient(Long savedRecipientId) {
		if (!savedRecipientRepository.existsById(savedRecipientId)) {
			throw new TransferBlockedException(HttpStatus.NOT_FOUND, "SAVED_RECIPIENT_NOT_FOUND",
				"저장한 수취인을 찾을 수 없습니다.", List.of());
		}
		savedRecipientRepository.deleteById(savedRecipientId);
	}

	/**
	 * 위험 점검. 실행 전 프론트가 안심확인 화면 노출 여부를 판단하는 데 사용한다.
	 * flowSessionId 가 주어지고 위험이 감지되면 RISK_DETECTED 를 기록해, 같은 세션의 송금 실행 때
	 * 안심확인 절차를 되짚을 수 있게 한다.
	 */
	@Transactional
	public RiskCheckResponse riskCheck(Long accountId, long amount, String recipientAccountNumber,
			boolean isNewAccountHint, boolean isInCall, boolean requestedByCaller, boolean phishingKeywordDetected,
			String flowSessionId) {
		Account account = accountRepository.findById(accountId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "출금 계좌를 찾을 수 없습니다."));
		ensureWithdrawable(account);

		RiskAssessment assessment = assess(account, amount, recipientAccountNumber,
			isNewAccountHint, isInCall, requestedByCaller, phishingKeywordDetected);

		if (assessment.risky()) {
			helpService.markRiskDetected(account.getUserId(), flowSessionId,
				FlowType.REAL_TRANSFER, SAFETY_CHECK_SCREEN);
		}

		return new RiskCheckResponse(
			accountId,
			amount,
			assessment.risky(),
			assessment.hasBlocking(),
			assessment.risky(),
			assessment.recipientIsNew(),
			assessment.reasons()
		);
	}

	/** 송금 실행: 비밀번호 검증 → 위험 점검 → 잔액 차감 → 거래내역 생성 → 송금 기록. */
	@Transactional
	public TransferResponse execute(TransferExecuteRequest req) {
		Account account = accountRepository.findById(req.accountId())
			.orElseThrow(() -> new TransferBlockedException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND",
				"출금 계좌를 찾을 수 없습니다.", List.of()));
		ensureWithdrawable(account);

		if (!demoPassword.equals(req.accountPassword())) {
			throw new TransferBlockedException(HttpStatus.BAD_REQUEST, "ACCOUNT_PASSWORD_ERROR",
				"결제 비밀번호가 일치하지 않습니다.", List.of());
		}

		RiskAssessment risk = assess(account, req.amount(), req.recipientAccountNumber(),
			false, req.isInCall(), req.requestedByCaller(), req.phishingKeywordDetected());

		if (risk.hasBlocking()) {
			throw new TransferBlockedException(HttpStatus.UNPROCESSABLE_CONTENT, "TRANSFER_BLOCKED",
				"입력값을 확인해 주세요.", risk.reasons());
		}
		if (risk.risky()) {
			// riskAcknowledged=true 만으로는 부족하다. 해당 flowSession 에 실제 SAFETY_CHECK 완료 기록이 있어야 실행.
			boolean safetyDone = Boolean.TRUE.equals(req.riskAcknowledged())
				&& helpService.isSafetyCheckCompleted(account.getUserId(), req.flowSessionId());
			// 프론트 안심확인 팝업을 거쳤고(ack) 같은 세션에 위험 점검(RISK_DETECTED) 기록이 있으면,
			// 서버가 SAFETY_CHECK 노출/확인 이벤트를 마무리로 기록하고 진행한다.
			if (!safetyDone && Boolean.TRUE.equals(req.riskAcknowledged())) {
				safetyDone = helpService.confirmSafetyCheck(account.getUserId(), req.flowSessionId(),
					FlowType.REAL_TRANSFER, SAFETY_CHECK_SCREEN);
			}
			if (!safetyDone) {
				throw new TransferBlockedException(HttpStatus.CONFLICT, "SAFETY_CHECK_REQUIRED",
					"안심 확인이 필요합니다.", risk.reasons());
			}
		}

		try {
			account.withdraw(req.amount());
		} catch (IllegalArgumentException e) {
			throw new TransferBlockedException(HttpStatus.UNPROCESSABLE_CONTENT, "TRANSFER_BLOCKED",
				e.getMessage(), List.of(RiskReason.AMOUNT_EXCEEDS_BALANCE));
		}

		Transaction transaction = transactionRepository.save(Transaction.builder()
			.accountId(account.getAccountId())
			.transactionType(TransactionType.WITHDRAWAL)
			.description(req.recipientName() + " 송금")
			.amount(req.amount())
			.occurredAt(LocalDateTime.now())
			.reviewStatus(ReviewStatus.PENDING)
			.build());

		Transfer transfer = Transfer.builder()
			.accountId(account.getAccountId())
			.savedRecipientId(req.savedRecipientId())
			.recipientBankCode(req.recipientBankCode())
			.recipientAccountNumber(req.recipientAccountNumber())
			.recipientName(req.recipientName())
			.amount(req.amount())
			.transferMethod(req.transferMethod())
			.recipientIsNew(risk.recipientIsNew())
			.status(TransferStatus.COMPLETED)
			.requestedAt(LocalDateTime.now())
			.completedAt(LocalDateTime.now())
			.isInCall(req.isInCall())
			.isRisky(risk.risky())
			.build();
		transferRepository.save(transfer);

		return TransferResponse.of(transfer, transaction.getTransactionId(), account.getBalance());
	}

	/**
	 * 일반 송금 출금 가능 조건: 계좌가 ACTIVE 이고 연결 상품의 product_type 이 CHECKING.
	 * 위험 점검(riskCheck)과 실제 송금 실행(execute)에 동일하게 적용한다.
	 */
	private void ensureWithdrawable(Account account) {
		if (account.getAccountStatus() != AccountStatus.ACTIVE) {
			throw notWithdrawable("정상 상태(ACTIVE)의 계좌에서만 송금할 수 있습니다.");
		}
		Long productId = account.getProductId();
		ProductType productType = productId == null ? null
			: accountProductRepository.findById(productId).map(AccountProduct::getProductType).orElse(null);
		if (productType != ProductType.CHECKING) {
			throw notWithdrawable("입출금(CHECKING) 계좌에서만 송금할 수 있습니다.");
		}
	}

	private TransferBlockedException notWithdrawable(String message) {
		return new TransferBlockedException(HttpStatus.UNPROCESSABLE_CONTENT, "ACCOUNT_NOT_WITHDRAWABLE",
			message, List.of());
	}

	private RiskAssessment assess(Account account, long amount, String recipientAccountNumber,
			boolean isNewAccountHint, boolean isInCall, boolean requestedByCaller, boolean phishingKeywordDetected) {
		EnumSet<RiskReason> reasons = EnumSet.noneOf(RiskReason.class);

		if (amount <= 0) {
			reasons.add(RiskReason.AMOUNT_INVALID);
		}
		if (recipientAccountNumber != null && !recipientAccountNumber.isBlank()
			&& !isValidAccountNumber(recipientAccountNumber)) {
			reasons.add(RiskReason.ACCOUNT_NUMBER_INVALID);
		}
		if (amount > account.getBalance()) {
			reasons.add(RiskReason.AMOUNT_EXCEEDS_BALANCE);
		}
		if (amount >= highAmountThreshold) {
			reasons.add(RiskReason.HIGH_AMOUNT);
		}

		boolean recipientIsNew = isNewAccountHint;
		if (recipientAccountNumber != null && !recipientAccountNumber.isBlank()) {
			long priorCompleted = transferRepository.countByAccountIdAndRecipientAccountNumberAndStatus(
				account.getAccountId(), recipientAccountNumber, TransferStatus.COMPLETED);
			if (priorCompleted == 0) {
				recipientIsNew = true;
			}
			long recentCount = transferRepository.countByAccountIdAndRecipientAccountNumberAndStatusAndCompletedAtAfter(
				account.getAccountId(), recipientAccountNumber, TransferStatus.COMPLETED,
				LocalDateTime.now().minusHours(REPEATED_TRANSFER_WINDOW_HOURS));
			if (recentCount >= REPEATED_TRANSFER_MIN_COUNT) {
				reasons.add(RiskReason.REPEATED_TRANSFER);
			}
		}
		if (recipientIsNew) {
			reasons.add(RiskReason.NEW_RECIPIENT);
		}
		if (isInCall) {
			reasons.add(RiskReason.IN_CALL);
		}
		if (requestedByCaller) {
			reasons.add(RiskReason.RUSHED);
		}
		if (phishingKeywordDetected) {
			reasons.add(RiskReason.PHISHING_KEYWORD_DETECTED);
		}

		return new RiskAssessment(List.copyOf(reasons), recipientIsNew);
	}

	private boolean isValidAccountNumber(String raw) {
		if (raw == null) {
			return false;
		}
		String digits = raw.replaceAll("[^0-9]", "");
		return digits.length() >= 10 && digits.length() <= 16;
	}

	private String mockRecipientName(String accountNumber) {
		String digits = accountNumber.replaceAll("[^0-9]", "");
		int idx = Math.floorMod(digits.hashCode(), MOCK_NAMES.length);
		return MOCK_NAMES[idx];
	}

	private String recipientKey(String bankCode, String accountNumber) {
		return bankCode + "|" + accountNumber.replaceAll("[^0-9]", "");
	}

	private record RiskAssessment(List<RiskReason> reasons, boolean recipientIsNew) {

		boolean hasBlocking() {
			return reasons.stream().anyMatch(RiskReason::isBlocking);
		}

		List<RiskReason> safetyReasons() {
			return reasons.stream().filter(RiskReason::isSafety).toList();
		}

		boolean risky() {
			return !safetyReasons().isEmpty();
		}
	}
}
