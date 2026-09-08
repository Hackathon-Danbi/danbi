package com.danbi.domain.transfer.dto;

public record AccountHolderResponse(
	String recipientBankCode,
	String recipientAccountNumber,
	String recipientName,
	boolean registered
) {
}
