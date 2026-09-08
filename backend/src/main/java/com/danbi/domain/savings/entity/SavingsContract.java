package com.danbi.domain.savings.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.danbi.domain.account.entity.Account;

@Entity
@Table(name = "savings_contracts", uniqueConstraints = @UniqueConstraint(name = "UK_SAVINGS_CONTRACTS_ACCOUNT", columnNames = "account_id"))
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SavingsContract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_id")
    private Long contractId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false,
            foreignKey = @ForeignKey(name = "FK_SAVINGS_CONTRACTS_ACCOUNT"))
    private Account account;

    @Column(name = "applied_interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal appliedInterestRate;

    @Column(name = "monthly_payment_amount")
    private Long monthlyPaymentAmount;

    @Column(name = "opened_at", nullable = false)
    private LocalDate openedAt;

    @Column(name = "maturity_at", nullable = false)
    private LocalDate maturityAt;

    @Column(name = "expected_maturity_amount", nullable = false)
    private Long expectedMaturityAmount;

    @Builder.Default
    @ColumnDefault("'ACTIVE'")
    @Enumerated(EnumType.STRING)
    @Column(name = "contract_status", nullable = false)
    private ContractStatus contractStatus = ContractStatus.ACTIVE;
}
