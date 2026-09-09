package com.danbi.domain.voice.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.danbi.domain.account.entity.Account;
import com.danbi.domain.account.entity.AccountProduct;
import com.danbi.domain.account.entity.AccountStatus;
import com.danbi.domain.account.entity.ProductType;
import com.danbi.domain.account.repository.AccountProductRepository;
import com.danbi.domain.account.repository.AccountRepository;
import com.danbi.domain.transaction.entity.PaymentMethod;
import com.danbi.domain.transaction.entity.ReviewStatus;
import com.danbi.domain.transaction.entity.Transaction;
import com.danbi.domain.transaction.entity.TransactionType;
import com.danbi.domain.transaction.repository.TransactionRepository;
import com.danbi.domain.voice.dto.VoiceQueryResponse;
import com.danbi.support.MutableClock;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class VoiceQueryServiceTest {

	private static final LocalDateTime NOW = LocalDateTime.of(2026, 9, 15, 10, 0, 0);

	@TestConfiguration
	static class ClockOverride {
		@Bean
		@Primary
		MutableClock testClock() {
			return MutableClock.atSeoul(NOW);
		}
	}

	@Autowired private VoiceQueryService voiceQueryService;
	@Autowired private AccountRepository accountRepository;
	@Autowired private AccountProductRepository accountProductRepository;
	@Autowired private TransactionRepository transactionRepository;
	@Autowired private MutableClock clock;

	private Long accountId;

	@BeforeEach
	void setUp() {
		clock.setTo(NOW);

		AccountProduct product = accountProductRepository.save(AccountProduct.builder()
			.productName("입출금").productType(ProductType.CHECKING)
			.baseInterestRate(new BigDecimal("0.10")).additionalPaymentAllowed(false).build());
		accountId = accountRepository.save(Account.builder()
			.userId(1L).product(product).accountName("생활비 통장").bankName("KB국민은행")
			.accountNumber("123456789012").balance(2_450_000L).isPrimary(true)
			.accountStatus(AccountStatus.ACTIVE).build()).getAccountId();
		ReflectionTestUtils.setField(voiceQueryService, "demoAccountId", accountId);

		// 이번 달(9월) 지출 43,800 + 168,000 = 211,800 / 입금 650,000 / 미확인 1건
		save(TransactionType.WITHDRAWAL, "행복마트", 43_800L, NOW.minusDays(2), ReviewStatus.KNOWN);
		save(TransactionType.WITHDRAWAL, "관리비", 168_000L, NOW.minusDays(5), ReviewStatus.KNOWN);
		save(TransactionType.DEPOSIT, "국민연금 입금", 650_000L, NOW.minusDays(3), ReviewStatus.KNOWN);
		save(TransactionType.WITHDRAWAL, "온누리약국", 12_500L, NOW.minusDays(1), ReviewStatus.PENDING);
		// 지난 달(8월) 지출 30,000
		save(TransactionType.WITHDRAWAL, "지난달 마트", 30_000L, NOW.minusMonths(1).withDayOfMonth(10), ReviewStatus.KNOWN);
	}

	private void save(TransactionType type, String desc, long amount, LocalDateTime at, ReviewStatus status) {
		transactionRepository.save(Transaction.builder()
			.accountId(accountId).transactionType(type).paymentMethod(PaymentMethod.TRANSFER)
			.description(desc).amount(amount).occurredAt(at).reviewStatus(status).build());
	}

	@Test
	void thisMonthSpending() {
		VoiceQueryResponse res = voiceQueryService.answer("이번 달에 얼마 썼어?");
		assertThat(res.answerText()).contains("이번 달").contains("224,300원").contains("쓰셨어요");
		assertThat(res.relatedAccountId()).isEqualTo(accountId);
	}

	@Test
	void lastMonthSpending() {
		VoiceQueryResponse res = voiceQueryService.answer("지난달에 얼마 썼어?");
		assertThat(res.answerText()).contains("지난달").contains("30,000원");
	}

	@Test
	void thisMonthIncome() {
		VoiceQueryResponse res = voiceQueryService.answer("이번 달에 얼마 들어왔어?");
		assertThat(res.answerText()).contains("650,000원").contains("들어왔어요");
	}

	@Test
	void balance() {
		VoiceQueryResponse res = voiceQueryService.answer("잔액 알려줘");
		assertThat(res.answerText()).contains("KB국민은행").contains("2,450,000원").contains("있어요");
	}

	@Test
	void unreviewedCount() {
		VoiceQueryResponse res = voiceQueryService.answer("모르는 거래 있어?");
		assertThat(res.answerText()).contains("1건");
	}

	@Test
	void recentTransaction() {
		VoiceQueryResponse res = voiceQueryService.answer("가장 최근 거래 뭐야?");
		assertThat(res.answerText()).contains("가장 최근 거래는").contains("9월");
	}

	@Test
	void fallbackForUnknownQuestion() {
		VoiceQueryResponse res = voiceQueryService.answer("오늘 날씨 어때?");
		assertThat(res.answerText()).contains("알려드릴 수 있어요");
	}
}
