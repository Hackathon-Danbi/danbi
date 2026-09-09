package com.danbi.domain.practice.dto;

import jakarta.validation.constraints.NotNull;

/**
 * FE {@code financialIndependenceApi.completePractice} 요청 바디.
 * PATCH /api/daily-activities/{dailyActivityId}/practice
 * {@code practiceCompleted} 는 FE가 항상 true 로 보내며, 서버는 완료 처리만 한다.
 */
public record CompletePracticeRequest(
	@NotNull Long missionId,
	Boolean practiceCompleted
) {
}
