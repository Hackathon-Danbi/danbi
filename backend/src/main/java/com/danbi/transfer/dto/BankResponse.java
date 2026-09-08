package com.danbi.transfer.dto;

import com.danbi.transfer.entity.Bank;

public record BankResponse(
	String code,
	String name
) {

	public static BankResponse from(Bank bank) {
		return new BankResponse(bank.getCode(), bank.getName());
	}
}
