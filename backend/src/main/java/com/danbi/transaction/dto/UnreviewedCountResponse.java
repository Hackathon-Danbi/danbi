package com.danbi.transaction.dto;

public record UnreviewedCountResponse(
	Long accountId,
	long unreviewedCount
) {
}
