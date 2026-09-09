package com.danbi.domain.practice.dto;

public record QuizAnswerResponse(
	boolean correct,
	int correctIndex,
	String explanation,
	boolean alreadyAnswered,
	boolean dayCompleted
) {
}
