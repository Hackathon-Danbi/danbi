package com.danbi.domain.practice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 연습 모드 송금 세션. 실제 돈은 움직이지 않고(actualTransferCreated=false),
 * 완료 시 미션 배점만 기록해 "나의 금융 독립" 점수 동기화에 쓴다.
 */
@Entity
@Table(name = "practice_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PracticeSession {

	@Id
	@Column(name = "session_id", length = 40, nullable = false, updatable = false)
	private String sessionId;

	@Column(name = "mission_id", nullable = false)
	private Long missionId;

	@Enumerated(EnumType.STRING)
	@Column(name = "mode", nullable = false, length = 20)
	private PracticeMode mode;

	@Enumerated(EnumType.STRING)
	@Column(name = "input_type", nullable = false, length = 20)
	private PracticeInputType inputType;

	@Column(name = "practice_completed", nullable = false)
	private boolean practiceCompleted;

	@Column(name = "earned_score", nullable = false)
	private int earnedScore;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "completed_at")
	private LocalDateTime completedAt;

	private PracticeSession(String sessionId, Long missionId, PracticeMode mode,
			PracticeInputType inputType, LocalDateTime createdAt) {
		this.sessionId = sessionId;
		this.missionId = missionId;
		this.mode = mode;
		this.inputType = inputType;
		this.createdAt = createdAt;
		this.practiceCompleted = false;
		this.earnedScore = 0;
	}

	public static PracticeSession start(String sessionId, Long missionId, PracticeMode mode,
			PracticeInputType inputType, LocalDateTime createdAt) {
		return new PracticeSession(sessionId, missionId, mode, inputType, createdAt);
	}

	/** 최초 완료 시에만 배점을 반영한다(멱등). */
	public void complete(int scoreReward, LocalDateTime completedAt) {
		if (practiceCompleted) {
			return;
		}
		this.practiceCompleted = true;
		this.earnedScore = Math.max(scoreReward, 0);
		this.completedAt = completedAt;
	}
}
