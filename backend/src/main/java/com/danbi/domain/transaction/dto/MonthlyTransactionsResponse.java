package com.danbi.domain.transaction.dto;

import java.util.List;

public record MonthlyTransactionsResponse(
	Long accountId,
	int year,
	int month,
	int count,
	List<TransactionResponse> transactions
) {
}
