package com.danbi.domain.savings.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_savings_payments", uniqueConstraints = @UniqueConstraint(name = "UK_MONTHLY_PAYMENT_CONTRACT_MONTH",
        columnNames = {"contract_id", "payment_month"}))
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class MonthlySavingsPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "monthly_payment_id")
    private Long monthlyPaymentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id", nullable = false,
            foreignKey = @ForeignKey(name = "FK_MONTHLY_PAYMENT_CONTRACT"))
    private SavingsContract contract;

    // Transaction 엔티티가 추가되면 연관관계로 전환한다.
    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(name = "payment_month", nullable = false, length = 7, columnDefinition = "CHAR(7)")
    private String paymentMonth;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "scheduled_amount", nullable = false)
    private Long scheduledAmount;

    @Column(name = "amount")
    private Long amount;

    @Builder.Default
    @ColumnDefault("'SCHEDULED'")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status = PaymentStatus.SCHEDULED;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
