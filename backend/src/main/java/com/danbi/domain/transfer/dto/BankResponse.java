package com.danbi.domain.transfer.dto;

import com.danbi.domain.transfer.entity.Bank;

public record BankResponse(
	String code,
	String name
) {

	public static BankResponse from(Bank bank) {
		return new BankResponse(bank.getCode(), bank.getName());
	}
}
