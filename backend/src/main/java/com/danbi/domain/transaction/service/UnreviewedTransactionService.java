package com.danbi.domain.transaction.service;

import com.danbi.domain.account.entity.Account;
import com.danbi.domain.account.repository.AccountRepository;
import com.danbi.domain.transaction.dto.UnreviewedTransactionsResponse.*;
import com.danbi.domain.transaction.dto.UnreadVoiceSummaryResponse;
import com.danbi.domain.transaction.entity.ReviewStatus;
import com.danbi.domain.transaction.entity.Transaction;
import com.danbi.domain.transaction.entity.TransactionType;
import com.danbi.domain.transaction.repository.TransactionRepository;
import com.danbi.domain.transaction.repository.TransactionRepository.PendingCount;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UnreviewedTransactionService {
    private final AccountRepository accounts;
    private final TransactionRepository transactions;
    private final Clock clock;

    public Summary summary(Long userId) {
        var counts = transactions.countByOwner(userId, ReviewStatus.PENDING);
        return new Summary(days(counts), counts.stream().mapToLong(PendingCount::getCount).sum());
    }

    public AccountCounts counts(Long userId) {
        var counts = transactions.countByOwner(userId, ReviewStatus.PENDING);
        var byAccount = counts.stream().collect(Collectors.toMap(PendingCount::getAccountId, Function.identity()));
        var result = accounts.findByUserId(userId).stream()
                .sorted(Comparator.comparing(Account::getAccountId))
                .map(account -> new AccountCount(account.getAccountId(), account.getAccountName(),
                        account.getBankName(), last4(account), byAccount.containsKey(account.getAccountId())
                        ? byAccount.get(account.getAccountId()).getCount() : 0))
                .toList();
        return new AccountCounts(days(counts), result);
    }

    public AccountTransactions list(Long userId, Long accountId) {
        if (accountId == null || accountId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 계좌 ID입니다.");
        }
        var account = accounts.findByAccountIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "계좌를 찾을 수 없습니다."));
        var items = transactions.findByAccountIdAndReviewStatusOrderByOccurredAtDescTransactionIdDesc(
                accountId, ReviewStatus.PENDING).stream().map(Item::from).toList();
        return new AccountTransactions(accountId, account.getAccountName(), account.getBankName(),
                last4(account), items.size(), items);
    }

	/** 미확인 거래의 의미를 시니어가 바로 이해할 수 있는 짧은 문장으로 요약한다. */
	public UnreadVoiceSummaryResponse voiceSummary(Long userId) {
		var countResponse = counts(userId);
		var accountSummaries = countResponse.accounts().stream()
			.filter(account -> account.unreviewedCount() > 0)
			.map(account -> new UnreadVoiceSummaryResponse.AccountSummary(
				account.accountId(), account.accountName(), account.unreviewedCount()))
			.toList();
		var pending = accountSummaries.stream()
			.flatMap(account -> transactions
				.findByAccountIdAndReviewStatusOrderByOccurredAtDescTransactionIdDesc(
					account.accountId(), ReviewStatus.PENDING)
				.stream())
			.sorted(Comparator.comparing(Transaction::getOccurredAt).reversed())
			.toList();

		String summaryText = pending.isEmpty()
			? "새로 확인할 주요 거래가 없어요."
			: pending.stream().map(this::voiceLine).distinct().collect(Collectors.joining(" "));
		long unreadCount = accountSummaries.stream()
			.mapToLong(UnreadVoiceSummaryResponse.AccountSummary::unreadCount)
			.sum();
		return new UnreadVoiceSummaryResponse(unreadCount, accountSummaries, summaryText, null);
	}

	private String voiceLine(Transaction transaction) {
		String description = transaction.getDescription();
		if (description.contains("연금") && transaction.getTransactionType() == TransactionType.DEPOSIT) {
			return "연금이 들어왔어요.";
		}
		if (description.contains("적금")) {
			return "적금이 자동 납입됐어요.";
		}
		return transaction.getTransactionType() == TransactionType.DEPOSIT
			? description + " 입금이 있었어요."
			: description + " 출금이 있었어요.";
	}

    private long days(List<PendingCount> counts) {
        return counts.stream().map(PendingCount::getOldest).min(Comparator.naturalOrder())
                .map(oldest -> Math.max(0, ChronoUnit.DAYS.between(oldest.toLocalDate(), LocalDate.now(clock))))
                .orElse(0L);
    }

    private String last4(Account account) {
        String number = account.getAccountNumber().replaceAll("[^0-9]", "");
        return number.substring(Math.max(0, number.length() - 4));
    }
}
