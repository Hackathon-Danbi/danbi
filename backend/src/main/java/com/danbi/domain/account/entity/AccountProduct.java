package com.danbi.domain.account.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 상품 공통 정보. 모든 보유 계좌(accounts)는 하나의 상품과 연결된다.
 * 예적금의 개인별 가입 조건(적용금리, 만기일 등)은 savings_contracts(예적금 파트)로 분리되어 있다.
 */
@Entity
@Table(name = "account_products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class AccountProduct {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long productId;

	@Column(nullable = false, length = 100)
	private String productName;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private ProductType productType;

	@Column(nullable = false, precision = 5, scale = 2)
	private BigDecimal baseInterestRate;

	@Column(nullable = false)
	private boolean additionalPaymentAllowed;
}
