package com.danbi.domain.savings.dto;

import com.danbi.domain.account.entity.ProductType;
import com.danbi.domain.savings.entity.MonthlySavingsPayment;
import com.danbi.domain.savings.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class SavingsResponse {
    private SavingsResponse() {}

    public record AccountList(List<Summary> savings) {}

    public record Summary(Long accountId, String productName, ProductType productType,
                          Long balance, BigDecimal appliedInterestRate, LocalDate maturityAt,
                          long remainingMonths, CurrentMonthPayment currentMonthPayment) {}

    public record Deposit(Long accountId, Long contractId, String productName, ProductType productType,
                          Long balance, BigDecimal appliedInterestRate, Long expectedMaturityAmount,
                          LocalDate openedAt, LocalDate maturityAt, boolean additionalPaymentAllowed) {}

    public record Installment(Long accountId, Long contractId, String productName, ProductType productType,
                              Long balance, BigDecimal appliedInterestRate, Long expectedMaturityAmount,
                              LocalDate maturityAt, CurrentMonthPayment currentMonthPayment) {}

    public record CurrentMonthPayment(LocalDate paymentDate, Long scheduledAmount, Long amount, PaymentStatus status) {
        public static CurrentMonthPayment from(MonthlySavingsPayment payment) {
            return new CurrentMonthPayment(payment.getDueDate(), payment.getScheduledAmount(),
                    payment.getAmount(), payment.getStatus());
        }
    }
}
