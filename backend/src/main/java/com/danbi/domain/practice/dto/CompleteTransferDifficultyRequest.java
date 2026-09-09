package com.danbi.domain.practice.dto;

import jakarta.validation.constraints.NotNull;

/** 맞춤 복습 완료 처리. completed=true 만 의미 있음. */
public record CompleteTransferDifficultyRequest(
	@NotNull Boolean completed
) {
}
