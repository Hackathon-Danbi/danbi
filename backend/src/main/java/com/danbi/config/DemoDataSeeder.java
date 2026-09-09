package com.danbi.config;

import com.danbi.domain.account.entity.Account;
import com.danbi.domain.account.entity.AccountProduct;
import com.danbi.domain.account.entity.AccountStatus;
import com.danbi.domain.account.entity.ProductType;
import com.danbi.domain.account.repository.AccountProductRepository;
import com.danbi.domain.account.repository.AccountRepository;
import com.danbi.domain.onboarding.service.SimplePasswordEncoder;
import com.danbi.domain.transaction.entity.PaymentMethod;
import com.danbi.domain.transaction.entity.ReviewStatus;
import com.danbi.domain.transaction.entity.Transaction;
import com.danbi.domain.transaction.entity.TransactionType;
import com.danbi.domain.transaction.repository.TransactionRepository;
import com.danbi.domain.transfer.entity.SavedRecipient;
import com.danbi.domain.transfer.repository.SavedRecipientRepository;
import com.danbi.domain.user.entity.User;
import com.danbi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 시연용 단일 사용자/계좌 시드. 해커톤 규모라 사용자·입출금 계좌는 각각 하나만 둔다.
 * users 가 비어 있을 때만 동작한다(온보딩으로 실제 가입한 사용자가 있으면 건드리지 않음).
 * 그 경우 이전 시연에서 남은 계좌/거래/수취인을 지우고 새로 심어, 프론트 기본 식별자
 * ({@code userId=1, accountId=1}, lib/api/identity.ts)와 맞는 깨끗한 상태를 만든다.
 * {@code danbi.demo-seed.enabled=false} 로 끌 수 있다(테스트는 꺼 둔다).
 */
@Component
@Order(200)
@ConditionalOnProperty(name = "danbi.demo-seed.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

	private static final String DEMO_ACCOUNT_NUMBER = "123456789012";
	private static final String DEMO_SIMPLE_PASSWORD = "1234";

	private final UserRepository userRepository;
	private final AccountRepository accountRepository;
	private final AccountProductRepository accountProductRepository;
	private final TransactionRepository transactionRepository;
	private final SavedRecipientRepository savedRecipientRepository;
	private final SimplePasswordEncoder simplePasswordEncoder;

	@PersistenceContext
	private EntityManager entityManager;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		// 온보딩으로 실제 가입한 사용자가 있으면 아무것도 건드리지 않는다.
		if (userRepository.count() > 0) {
			return;
		}
		// 사용자가 없는데 계좌/상품이 있으면 이전 시연에서 남은 데이터다. 깔끔히 지우고 다시 심는다.
		transactionRepository.deleteAllInBatch();
		savedRecipientRepository.deleteAllInBatch();
		accountRepository.deleteAllInBatch();
		accountProductRepository.deleteAllInBatch();
		// 프론트 기본 식별자(userId=1, accountId=1)와 맞도록 auto_increment 를 되돌린다(MySQL).
		resetAutoIncrement("users", "accounts", "account_products", "transactions", "saved_recipients");

		User user = userRepository.save(User.completeRegistration(
			"김단비", simplePasswordEncoder.encode(DEMO_SIMPLE_PASSWORD), Instant.now()));

		AccountProduct checking = accountProductRepository.save(AccountProduct.builder()
			.productName("단비 입출금통장")
			.productType(ProductType.CHECKING)
			.baseInterestRate(new BigDecimal("0.10"))
			.additionalPaymentAllowed(false)
			.build());

		Account account = accountRepository.save(Account.builder()
			.userId(user.getUserId())
			.product(checking)
			.accountName("단비 입출금통장")
			.bankName("KB국민은행")
			.accountNumber(DEMO_ACCOUNT_NUMBER)
			.balance(3_200_000L)
			.isPrimary(true)
			.accountStatus(AccountStatus.ACTIVE)
			.build());

		seedTransactions(account.getAccountId());
		seedSavedRecipients(user.getUserId());
	}

	private void seedTransactions(Long accountId) {
		LocalDateTime now = LocalDateTime.now();
		List<Transaction> rows = List.of(
			tx(accountId, TransactionType.DEPOSIT, PaymentMethod.TRANSFER, "국민연금 입금", 380_000L,
				now.minusDays(2).withHour(9).withMinute(12), ReviewStatus.KNOWN),
			tx(accountId, TransactionType.WITHDRAWAL, PaymentMethod.CHECK_CARD, "행복마트 장보기", 43_800L,
				now.minusDays(2).withHour(18).withMinute(40), ReviewStatus.KNOWN),
			tx(accountId, TransactionType.WITHDRAWAL, PaymentMethod.AUTO_TRANSFER, "관리비 자동이체", 168_000L,
				now.minusDays(4).withHour(7).withMinute(0), ReviewStatus.KNOWN),
			tx(accountId, TransactionType.WITHDRAWAL, PaymentMethod.CHECK_CARD, "온누리약국", 12_500L,
				now.minusDays(5).withHour(15).withMinute(22), ReviewStatus.PENDING),
			tx(accountId, TransactionType.WITHDRAWAL, PaymentMethod.TRANSFER, "김영수 송금", 200_000L,
				now.minusDays(6).withHour(11).withMinute(5), ReviewStatus.PENDING),
			tx(accountId, TransactionType.DEPOSIT, PaymentMethod.TRANSFER, "이순자 입금", 50_000L,
				now.minusDays(8).withHour(20).withMinute(31), ReviewStatus.KNOWN),
			tx(accountId, TransactionType.WITHDRAWAL, PaymentMethod.CHECK_CARD, "동네카페", 6_500L,
				now.minusDays(9).withHour(14).withMinute(2), ReviewStatus.PENDING),
			tx(accountId, TransactionType.WITHDRAWAL, PaymentMethod.CHECK_CARD, "정든슈퍼", 28_400L,
				now.minusDays(12).withHour(19).withMinute(48), ReviewStatus.KNOWN),
			tx(accountId, TransactionType.WITHDRAWAL, PaymentMethod.AUTO_TRANSFER, "휴대폰 요금", 41_250L,
				now.minusDays(15).withHour(8).withMinute(0), ReviewStatus.KNOWN),
			tx(accountId, TransactionType.DEPOSIT, PaymentMethod.TRANSFER, "박민호 입금", 120_000L,
				now.minusDays(19).withHour(13).withMinute(17), ReviewStatus.KNOWN)
		);
		transactionRepository.saveAll(rows);
	}

	private Transaction tx(Long accountId, TransactionType type, PaymentMethod method, String description,
			long amount, LocalDateTime occurredAt, ReviewStatus reviewStatus) {
		return Transaction.builder()
			.accountId(accountId)
			.transactionType(type)
			.paymentMethod(method)
			.description(description)
			.amount(amount)
			.occurredAt(occurredAt)
			.reviewStatus(reviewStatus)
			.build();
	}

	private void resetAutoIncrement(String... tables) {
		for (String table : tables) {
			try {
				entityManager.createNativeQuery("ALTER TABLE " + table + " AUTO_INCREMENT = 1").executeUpdate();
			} catch (RuntimeException ignored) {
				// auto_increment 를 못 되돌려도 시드 자체는 진행한다(FE identity 기본값과 어긋날 수 있음).
			}
		}
	}

	private void seedSavedRecipients(Long userId) {
		savedRecipientRepository.saveAll(List.of(
			SavedRecipient.builder().userId(userId).recipientBankCode("088")
				.recipientAccountNumber("11022334455").recipientName("이영희").nickname("딸").build(),
			SavedRecipient.builder().userId(userId).recipientBankCode("020")
				.recipientAccountNumber("1002345678901").recipientName("박철수").nickname("아들").build(),
			SavedRecipient.builder().userId(userId).recipientBankCode("004")
				.recipientAccountNumber("12345678901234").recipientName("김순자").nickname("동생").build()
		));
	}
}
