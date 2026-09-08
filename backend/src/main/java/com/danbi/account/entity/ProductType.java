package com.danbi.account.entity;

/**
 * 상품 유형. account_products.product_type.
 * CHECKING 만 일반 입출금 계좌이고 나머지는 예적금 상품이다.
 */
public enum ProductType {
	CHECKING,
	TIME_DEPOSIT,
	FIXED_SAVINGS,
	FREE_SAVINGS
}
