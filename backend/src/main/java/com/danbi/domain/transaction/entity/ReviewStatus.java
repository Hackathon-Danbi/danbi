package com.danbi.domain.transaction.entity;

/**
 * 거래내역 확인 상태.
 * PENDING  - 아직 확인 안 함(미확인)
 * KNOWN    - 사용자가 아는 거래
 * UNKNOWN  - 사용자가 모르는 거래(이상거래 의심)
 */
public enum ReviewStatus {
	PENDING,
	KNOWN,
	UNKNOWN
}
