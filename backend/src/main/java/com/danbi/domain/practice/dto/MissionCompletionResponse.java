package com.danbi.domain.practice.dto;

public record MissionCompletionResponse(
	int earnedPoints,
	int totalScore,
	int maxScore,
	boolean firstCompletion,
	boolean practiceAlreadyCompletedToday,
	boolean dayCompleted
) {
}
