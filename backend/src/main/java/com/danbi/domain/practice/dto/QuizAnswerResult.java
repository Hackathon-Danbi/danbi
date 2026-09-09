package com.danbi.domain.practice.dto;

/** FE {@code QuizAnswerResult} 계약과 1:1. 하루 1회, 첫 응답이 유지된다(멱등). */
public record QuizAnswerResult(
	Long questionId,
	boolean selectedAnswer,
	boolean correct,
	boolean correctAnswer,
	String explanation,
	int earnedScore
) {
}
