package com.danbi.domain.agent.tools;

import java.time.LocalDate;
import java.util.Objects;

public final class BankingData {
    private BankingData() {}
    public record DateRange(LocalDate from, LocalDate to) {
        public DateRange {
            Objects.requireNonNull(from);
            Objects.requireNonNull(to);
            if (from.isAfter(to)) throw new IllegalArgumentException("Start date must not follow end date");
        }
    }
    public record TransactionData(LocalDate date, String description, long amount) {
        public TransactionData {
            Objects.requireNonNull(date);
            Objects.requireNonNull(description);
        }
    }
    public record RecipientData(String id, String name, String accountMasked) {
        public RecipientData {
            Objects.requireNonNull(id);
            Objects.requireNonNull(name);
            Objects.requireNonNull(accountMasked);
        }
    }
    public record TransferPreviewRequest(String recipientId, long amount) {
        public TransferPreviewRequest { Objects.requireNonNull(recipientId); }
    }
    public record TransferPreview(String recipientId, String recipientName, String accountMasked,
            long amount, String currency) {
        public TransferPreview {
            Objects.requireNonNull(recipientId);
            Objects.requireNonNull(recipientName);
            Objects.requireNonNull(accountMasked);
            Objects.requireNonNull(currency);
        }
    }
}
