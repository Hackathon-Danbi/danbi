package com.danbi.domain.account.entity;

/**
 * 계좌 상태. accounts.account_status.
 * 송금 출금은 ACTIVE 계좌에서만 가능하다.
 */
public enum AccountStatus {
	ACTIVE,
	DORMANT,
	CLOSED
}
