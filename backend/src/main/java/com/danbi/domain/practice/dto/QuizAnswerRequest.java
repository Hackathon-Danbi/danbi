package com.danbi.domain.practice.dto;

import jakarta.validation.constraints.NotNull;

/**
 * FE {@code financialIndependenceApi.answerQuiz} 요청 바디.
 * POST /api/daily-activities/{dailyActivityId}/answer
 *
 * @param selectedAnswer 사용자가 고른 답 (O = true, X = false)
 */
public record QuizAnswerRequest(
	@NotNull Boolean selectedAnswer
) {
}
