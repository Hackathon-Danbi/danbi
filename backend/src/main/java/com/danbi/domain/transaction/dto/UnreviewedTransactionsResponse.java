package com.danbi.domain.transaction.dto;

import com.danbi.domain.transaction.entity.PaymentMethod;
import com.danbi.domain.transaction.entity.ReviewStatus;
import com.danbi.domain.transaction.entity.Transaction;
import com.danbi.domain.transaction.entity.TransactionType;
import java.time.LocalDateTime;
import java.util.List;

public final class UnreviewedTransactionsResponse {
    private UnreviewedTransactionsResponse() {}

    public record Summary(long unreviewedDays, long unreviewedCount) {}
    public record AccountCounts(long unreviewedDays, List<AccountCount> accounts) {}
    public record AccountCount(Long accountId, String accountName, String bankName,
                               String accountNumberLast4, long unreviewedCount) {}
    public record AccountTransactions(Long accountId, String accountName, String bankName,
                                      String accountNumberLast4, long unreviewedCount,
                                      List<Item> transactions) {}
    public record Item(Long transactionId, LocalDateTime occurredAt, String description,
                       TransactionType transactionType, PaymentMethod paymentMethod,
                       Long amount, ReviewStatus reviewStatus) {
        public static Item from(Transaction transaction) {
            return new Item(transaction.getTransactionId(), transaction.getOccurredAt(),
                    transaction.getDescription(), transaction.getTransactionType(), transaction.getPaymentMethod(),
                    Math.absExact(transaction.getAmount()), transaction.getReviewStatus());
        }
    }
}
