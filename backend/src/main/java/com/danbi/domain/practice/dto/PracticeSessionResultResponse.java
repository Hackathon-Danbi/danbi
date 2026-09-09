package com.danbi.domain.practice.dto;

import java.util.List;

/** FE {@code PracticeSessionResult} 계약과 1:1 (PracticeTransferResult + steps). */
public record PracticeSessionResultResponse(
	boolean practiceCompleted,
	int earnedScore,
	boolean actualTransferCreated,
	List<String> steps
) {

	private static final List<String> DEFAULT_STEPS = List.of("RECIPIENT", "AMOUNT", "CONFIRM", "PASSWORD");

	public static PracticeSessionResultResponse of(boolean completed, int earnedScore) {
		return new PracticeSessionResultResponse(completed, earnedScore, false, DEFAULT_STEPS);
	}
}
