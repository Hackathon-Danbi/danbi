package com.danbi.domain.practice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** FE {@code practiceApi.transfer} body: { accountId, amount, practicePassword }. 실제 이체는 없다. */
public record PracticeTransferRequest(
	@NotNull Long accountId,
	@NotNull @PositiveOrZero Long amount,
	String practicePassword
) {
}
