package com.danbi.domain.practice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Clock;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자별 연습(미션) 최초 완료 기록. 미션당 한 행. 금융 독립 점수의 원본.
 */
@Entity
@Table(
	name = "user_mission_progress",
	uniqueConstraints = @UniqueConstraint(
		name = "UK_USER_MISSION_PROGRESS_USER_MISSION",
		columnNames = {"user_id", "mission_id"}
	)
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserMissionProgress {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "progress_id")
	private Long progressId;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "mission_id", nullable = false)
	private Long missionId;

	@Column(name = "completed", nullable = false)
	private boolean completed;

	@Column(name = "completed_at")
	private LocalDateTime completedAt;

	private UserMissionProgress(Long userId, Long missionId) {
		this.userId = userId;
		this.missionId = missionId;
		this.completed = false;
	}

	public static UserMissionProgress of(Long userId, Long missionId) {
		return new UserMissionProgress(userId, missionId);
	}

	/** 최초 완료 처리. 이미 완료 상태면 아무것도 하지 않고 false 반환. */
	public boolean markCompleted(Clock clock) {
		if (completed) {
			return false;
		}
		this.completed = true;
		this.completedAt = LocalDateTime.now(clock);
		return true;
	}
}
