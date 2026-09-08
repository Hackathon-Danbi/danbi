package com.danbi.domain.account.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

/**
 * 보유 계좌 공통 정보. 입출금·예금·적금이 모두 이 테이블에 저장된다.
 * 상품 공통 정보는 account_products, 예적금 개인 가입조건은 savings_contracts(예적금 파트)로 분리되어 있다.
 * (연관관계 대신 프로젝트 관례에 따라 FK 를 id 값으로 보관한다.)
 */
@Entity
@Table(name = "accounts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Account {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long accountId;

	@Column(nullable = false)
	private Long userId;

	/** account_products 연결 FK. */
	@Column(nullable = false)
	private Long productId;

	@Column(nullable = false, length = 50)
	private String accountName;

	@Column(nullable = false, unique = true, length = 30)
	private String accountNumber;

	@Column(nullable = false)
	@ColumnDefault("0")
	@Builder.Default
	private Long balance = 0L;

	@Column(nullable = false)
	@ColumnDefault("false")
	private boolean isPrimary;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	@Builder.Default
	private AccountStatus accountStatus = AccountStatus.ACTIVE;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	void onCreate() {
		if (this.createdAt == null) {
			this.createdAt = LocalDateTime.now();
		}
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
