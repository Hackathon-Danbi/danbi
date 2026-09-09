package com.danbi.domain.practice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Clock;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

/**
 * 실제 송금 플로우에서 사용자가 막혔던 지점 신호. 허브의 "다시 연습해볼까요?" 맞춤 복습 카드 원본.
 * 프론트 TransferDifficulty 와 대응한다.
 */
@Entity
@Table(name = "transfer_difficulties")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TransferDifficulty {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "difficulty_id")
	private Long difficultyId;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	/** 어떤 송금에서 발생했는지(있으면). */
	@Column(name = "transfer_id")
	private Long transferId;

	@Enumerated(EnumType.STRING)
	@Column(name = "step", nullable = false, length = 20)
	private TransferDifficultyStep step;

	@Enumerated(EnumType.STRING)
	@Column(name = "reason", length = 20)
	private TransferDifficultyReason reason;

	@Column(name = "occurred_at", nullable = false)
	private LocalDateTime occurredAt;

	@ColumnDefault("false")
	@Column(name = "completed", nullable = false)
	private boolean completed;

	@Column(name = "completed_at")
	private LocalDateTime completedAt;

	private TransferDifficulty(
		Long userId,
		Long transferId,
		TransferDifficultyStep step,
		TransferDifficultyReason reason,
		LocalDateTime occurredAt
	) {
		this.userId = userId;
		this.transferId = transferId;
		this.step = step;
		this.reason = reason;
		this.occurredAt = occurredAt;
		this.completed = false;
	}

	public static TransferDifficulty of(
		Long userId,
		Long transferId,
		TransferDifficultyStep step,
		TransferDifficultyReason reason,
		LocalDateTime occurredAt
	) {
		return new TransferDifficulty(userId, transferId, step, reason, occurredAt);
	}

	public boolean markCompleted(Clock clock) {
		if (completed) {
			return false;
		}
		this.completed = true;
		this.completedAt = LocalDateTime.now(clock);
		return true;
	}
}
