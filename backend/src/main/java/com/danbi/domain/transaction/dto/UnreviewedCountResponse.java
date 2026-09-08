package com.danbi.domain.transaction.dto;

public record UnreviewedCountResponse(
	Long accountId,
	long unreviewedCount
) {
}
