package com.danbi.domain.practice.dto;

import com.danbi.domain.practice.entity.PracticeInputType;
import com.danbi.domain.practice.entity.PracticeMode;
import com.danbi.domain.practice.entity.PracticeSession;

/** FE {@code PracticeSession} 계약과 1:1. */
public record PracticeSessionResponse(
	String sessionId,
	PracticeMissionResponse mission,
	PracticeMode mode,
	PracticeInputType inputType
) {

	public static PracticeSessionResponse of(PracticeSession session, PracticeMissionResponse mission) {
		return new PracticeSessionResponse(session.getSessionId(), mission, session.getMode(), session.getInputType());
	}
}
