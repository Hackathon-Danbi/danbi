package com.danbi.domain.practice.dto;

/** FE {@code PracticeCompletionResult} 계약과 1:1. */
public record PracticeCompletionResult(
	Long dailyActivityId,
	Long missionId,
	boolean practiceCompleted,
	int earnedScore
) {
}
