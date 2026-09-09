package com.danbi.domain.practice.dto;

import com.danbi.domain.practice.entity.PracticeInputType;
import com.danbi.domain.practice.entity.PracticeMode;
import jakarta.validation.constraints.NotNull;

/** FE {@code practiceApi.createSession} body: { mode, inputType, missionId }. */
public record CreatePracticeSessionRequest(
	@NotNull Long missionId,
	@NotNull PracticeMode mode,
	@NotNull PracticeInputType inputType
) {
}
