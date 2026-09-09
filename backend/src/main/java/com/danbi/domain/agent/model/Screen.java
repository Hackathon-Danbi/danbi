package com.danbi.domain.agent.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.danbi.domain.agent.tools.BankingData.TransactionData;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

/** Stable frontend wire contract. type is derived, so callers cannot mismatch it with fields. */
public sealed interface Screen {
    @JsonProperty("type")
    String type();

    record Message() implements Screen {
        @Override public String type() { return "message"; }
    }
    record Balance(long balance, String currency) implements Screen {
        public Balance { Objects.requireNonNull(currency); }
        @Override public String type() { return "balance"; }
    }
    record Transactions(LocalDate from, LocalDate to, List<TransactionData> items) implements Screen {
        public Transactions {
            Objects.requireNonNull(from);
            Objects.requireNonNull(to);
            items = List.copyOf(items);
        }
        @Override public String type() { return "transactions"; }
    }
    record TransferConfirmation(String recipientId, String recipientName, String accountMasked,
            long amount, String currency, boolean practice) implements Screen {
        public TransferConfirmation {
            Objects.requireNonNull(recipientId);
            Objects.requireNonNull(recipientName);
            Objects.requireNonNull(accountMasked);
            Objects.requireNonNull(currency);
        }
        @Override public String type() { return "transfer_confirmation"; }
    }
    record ProductExplanation() implements Screen {
        @Override public String type() { return "product_explanation"; }
    }
    record SignupGuide(String step) implements Screen {
        public SignupGuide { Objects.requireNonNull(step); }
        @Override public String type() { return "signup_guide"; }
    }
    record PracticeFeedback(String nextScenario, int inputErrors, int amountCorrections) implements Screen {
        public PracticeFeedback { Objects.requireNonNull(nextScenario); }
        @Override public String type() { return "practice_feedback"; }
    }
}
