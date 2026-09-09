package com.danbi.domain.practice.dto;

/** FE {@code PracticeTransferResult} 계약과 1:1. actualTransferCreated 는 항상 false. */
public record PracticeTransferResultResponse(
	boolean practiceCompleted,
	int earnedScore,
	boolean actualTransferCreated
) {

	public static PracticeTransferResultResponse of(boolean completed, int earnedScore) {
		return new PracticeTransferResultResponse(completed, earnedScore, false);
	}
}
