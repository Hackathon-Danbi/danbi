package com.danbi.domain.practice.dto;

/**
 * FE {@code TodayDailyActivity} 계약과 1:1. GET /api/daily-activities/today 응답.
 * {@code question.selectedAnswer} 는 아직 안 풀었으면 null (O = true, X = false).
 */
public record TodayDailyActivityResponse(
	Long dailyActivityId,
	String activityDate,
	Question question,
	Mission mission,
	boolean practiceCompleted,
	int earnedScore
) {

	public record Question(
		Long questionId,
		String questionText,
		Boolean selectedAnswer
	) {
	}

	public record Mission(
		Long missionId,
		String missionType,
		String title,
		String description,
		int scoreReward
	) {
	}
}
