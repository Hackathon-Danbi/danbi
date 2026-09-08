package com.danbi.transfer.dto;

public record AccountHolderResponse(
	String recipientBankCode,
	String recipientAccountNumber,
	String recipientName,
	boolean registered
) {
}
