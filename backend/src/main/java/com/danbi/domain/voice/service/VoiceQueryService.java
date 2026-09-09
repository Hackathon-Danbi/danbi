package com.danbi.domain.voice.service;

import com.danbi.domain.account.entity.Account;
import com.danbi.domain.account.repository.AccountRepository;
import com.danbi.domain.transaction.entity.ReviewStatus;
import com.danbi.domain.transaction.entity.Transaction;
import com.danbi.domain.transaction.entity.TransactionType;
import com.danbi.domain.transaction.repository.TransactionRepository;
import com.danbi.domain.voice.dto.VoiceQueryResponse;
import java.text.NumberFormat;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 홈 음성 질의를 규칙 기반으로 처리한다. 발화에서 의도를 뽑아 DB 를 조회하고
 * 자연어 문장으로 답한다. LLM 을 쓰지 않으며, 잔액·이번달/지난달 지출·입금·최근 거래·
 * 미확인 건수만 답한다. 그 밖의 질문은 안내 문장으로 돌려준다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VoiceQueryService {

	private final AccountRepository accountRepository;
	private final TransactionRepository transactionRepository;
	private final Clock clock;

	@Value("${danbi.agent.account-id:1}")
	private long demoAccountId;

	public VoiceQueryResponse answer(String rawQuery) {
		String q = rawQuery == null ? "" : rawQuery.replaceAll("[\\s?!.]", "");
		Account account = accountRepository.findById(demoAccountId).orElse(null);
		Long accountId = account == null ? null : account.getAccountId();

		if (isUnreviewed(q)) {
			return VoiceQueryResponse.of(unreviewedAnswer(accountId), accountId);
		}
		if (account == null) {
			return VoiceQueryResponse.of(fallback(), null);
		}
		Period period = detectPeriod(q);
		if (period != null && isSpending(q)) {
			return VoiceQueryResponse.of(sumAnswer(account, period, TransactionType.WITHDRAWAL), accountId);
		}
		if (period != null && isIncome(q)) {
			return VoiceQueryResponse.of(sumAnswer(account, period, TransactionType.DEPOSIT), accountId);
		}
		if (isRecent(q)) {
			return VoiceQueryResponse.of(recentAnswer(account), accountId);
		}
		if (isBalance(q)) {
			return VoiceQueryResponse.of(balanceAnswer(account), accountId);
		}
		if (isSpending(q)) {
			return VoiceQueryResponse.of(sumAnswer(account, Period.THIS_MONTH, TransactionType.WITHDRAWAL), accountId);
		}
		if (isIncome(q)) {
			return VoiceQueryResponse.of(sumAnswer(account, Period.THIS_MONTH, TransactionType.DEPOSIT), accountId);
		}
		return VoiceQueryResponse.of(fallback(), accountId);
	}

	// --- 의도 판별 ---

	private boolean isUnreviewed(String q) {
		return q.contains("미확인거래")
			|| q.matches(".*(모르는|모를|낯선|이상한|수상한|처음보는)(거래|결제|출금|입금|내역).*")
			|| q.matches(".*확인(안|하지않)(은|한|된)?(거래|결제).*");
	}

	private boolean isBalance(String q) {
		return q.contains("잔액") || q.contains("출금가능")
			|| q.matches(".*(통장|계좌|돈).*(얼마|얼만큼).*(있|남).*")
			|| q.matches(".*(얼마|얼만큼).*(있|남).*");
	}

	private boolean isSpending(String q) {
		return q.matches(".*(얼마|얼만큼|몇).*(썼|쓴|사용|지출|나갔|빠져).*")
			|| q.contains("지출") || q.contains("나간돈");
	}

	private boolean isIncome(String q) {
		return q.matches(".*(얼마|얼만큼|몇).*(들어왔|들어온|입금|벌었|받았).*")
			|| q.contains("수입") || q.contains("들어온돈");
	}

	private boolean isRecent(String q) {
		return q.matches(".*(마지막|최근|방금|가장최근|바로전).*(거래|결제|송금|입금|출금|쓴|산).*")
			|| q.contains("최근거래") || q.contains("마지막거래");
	}

	private Period detectPeriod(String q) {
		if (q.contains("지난달") || q.contains("저번달") || q.contains("전달")) {
			return Period.LAST_MONTH;
		}
		if (q.contains("이번달") || q.contains("이달") || q.contains("한달")) {
			return Period.THIS_MONTH;
		}
		return null;
	}

	// --- 답변 생성 ---

	private String balanceAnswer(Account account) {
		return "%s %s에 %s 있어요.".formatted(
			account.getBankName(), account.getAccountName(), won(account.getBalance()));
	}

	private String unreviewedAnswer(Long accountId) {
		if (accountId == null) {
			return "확인하지 않은 거래를 찾지 못했어요.";
		}
		long count = transactionRepository.countByAccountIdAndReviewStatus(accountId, ReviewStatus.PENDING);
		if (count == 0) {
			return "확인하지 않은 거래는 없어요.";
		}
		return "아직 확인하지 않은 거래가 %d건 있어요. 거래내역에서 확인해 보세요.".formatted(count);
	}

	private String sumAnswer(Account account, Period period, TransactionType type) {
		List<Transaction> rows = transactionsIn(account.getAccountId(), period);
		long total = rows.stream()
			.filter(t -> t.getTransactionType() == type)
			.mapToLong(Transaction::getAmount)
			.sum();
		String when = period == Period.LAST_MONTH ? "지난달" : "이번 달";
		if (total == 0) {
			return type == TransactionType.WITHDRAWAL
				? "%s에는 나간 돈이 없어요.".formatted(when)
				: "%s에는 들어온 돈이 없어요.".formatted(when);
		}
		String verb = type == TransactionType.WITHDRAWAL ? "쓰셨어요" : "들어왔어요";
		return "%s %s %s.".formatted(when, won(total), verb);
	}

	private String recentAnswer(Account account) {
		LocalDateTime now = LocalDateTime.now(clock);
		List<Transaction> rows = transactionRepository
			.findByAccountIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
				account.getAccountId(), now.minusMonths(6), now.plusDays(1));
		if (rows.isEmpty()) {
			return "최근 거래 내역이 없어요.";
		}
		Transaction t = rows.get(0);
		String flow = t.getTransactionType() == TransactionType.WITHDRAWAL ? "나갔어요" : "들어왔어요";
		return "가장 최근 거래는 %d월 %d일 %s %s %s.".formatted(
			t.getOccurredAt().getMonthValue(), t.getOccurredAt().getDayOfMonth(),
			t.getDescription(), won(t.getAmount()), flow);
	}

	private String fallback() {
		return "잔액, 이번 달 지출, 최근 거래, 확인하지 않은 거래를 알려드릴 수 있어요. "
			+ "\"이번 달 얼마 썼어\"처럼 물어봐 주세요.";
	}

	// --- helper ---

	private enum Period { THIS_MONTH, LAST_MONTH }

	private List<Transaction> transactionsIn(Long accountId, Period period) {
		LocalDate today = LocalDate.now(clock);
		LocalDate first = today.withDayOfMonth(1);
		if (period == Period.LAST_MONTH) {
			first = first.minusMonths(1);
		}
		LocalDateTime start = first.atStartOfDay();
		LocalDateTime end = first.plusMonths(1).atStartOfDay();
		return transactionRepository
			.findByAccountIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
				accountId, start, end);
	}

	private String won(long amount) {
		return NumberFormat.getIntegerInstance(Locale.KOREA).format(amount) + "원";
	}
}
