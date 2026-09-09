package com.danbi.domain.account.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts", uniqueConstraints = @UniqueConstraint(name = "UK_ACCOUNTS_ACCOUNT_NUMBER", columnNames = "account_number"))
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Long accountId;

    // User 엔티티가 추가되면 연관관계로 전환한다.
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false,
            foreignKey = @ForeignKey(name = "FK_ACCOUNTS_PRODUCT"))
    private AccountProduct product;

    @Column(name = "account_name", nullable = false, length = 50)
    private String accountName;

    @Builder.Default
    @ColumnDefault("'은행 정보 없음'")
    @Column(name = "bank_name", nullable = false, length = 50)
    private String bankName = "은행 정보 없음";

    @Column(name = "account_number", nullable = false, length = 30)
    private String accountNumber;

    @Builder.Default
    @ColumnDefault("0")
    @Column(name = "balance", nullable = false)
    private Long balance = 0L;

    @Builder.Default
    @ColumnDefault("false")
    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary = false;

    @Builder.Default
    @ColumnDefault("'ACTIVE'")
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false)
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @ColumnDefault("CURRENT_TIMESTAMP(6)")
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    private void initializeCreatedAt() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getProductId() {
        return product == null ? null : product.getProductId();
    }

    /** 송금 실행 시 출금. 잔액이 부족하면 예외. */
    public void withdraw(long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("출금액은 0보다 커야 합니다.");
        }
        if (this.balance < amount) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }
        this.balance -= amount;
    }

    /** 입금. */
    public void deposit(long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("입금액은 0보다 커야 합니다.");
        }
        this.balance += amount;
    }
}
