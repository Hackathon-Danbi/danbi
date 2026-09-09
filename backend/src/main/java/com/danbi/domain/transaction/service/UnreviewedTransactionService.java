package com.danbi.domain.transaction.service;

import com.danbi.domain.account.entity.Account;
import com.danbi.domain.account.repository.AccountRepository;
import com.danbi.domain.transaction.dto.UnreviewedTransactionsResponse.*;
import com.danbi.domain.transaction.entity.ReviewStatus;
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
