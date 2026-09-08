package com.danbi.domain.savings.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import com.danbi.domain.account.entity.Account;

@Entity
@Table(name = "auto_transfer_settings",
        uniqueConstraints = @UniqueConstraint(name = "UK_AUTO_TRANSFER_CONTRACT", columnNames = "contract_id"),
        check = {
                @CheckConstraint(name = "CK_AUTO_TRANSFER_DAY", constraint = "transfer_day BETWEEN 1 AND 28"),
                @CheckConstraint(name = "CK_AUTO_TRANSFER_AMOUNT", constraint = "transfer_amount > 0")
        })
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AutoTransferSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "auto_transfer_id")
    private Long autoTransferId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id", nullable = false,
            foreignKey = @ForeignKey(name = "FK_AUTO_TRANSFER_CONTRACT"))
    private SavingsContract contract;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "withdrawal_account_id", nullable = false,
            foreignKey = @ForeignKey(name = "FK_AUTO_TRANSFER_WITHDRAWAL_ACCOUNT"))
    private Account withdrawalAccount;

    @Column(name = "transfer_day", nullable = false)
    private Integer transferDay;

    @Column(name = "transfer_amount", nullable = false)
    private Long transferAmount;

    @Builder.Default
    @ColumnDefault("true")
    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;
}
