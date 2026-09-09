package com.danbi.domain.practice.dto;

/** FE {@code PracticeAccount} 계약과 1:1. 연습용 가상 수취인. */
public record PracticeAccountResponse(
	long accountId,
	String recipientName,
	String bankCode,
	String accountNumber
) {
}
