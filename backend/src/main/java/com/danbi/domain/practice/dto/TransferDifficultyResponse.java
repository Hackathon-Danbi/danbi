package com.danbi.domain.practice.dto;

import com.danbi.domain.practice.entity.TransferDifficulty;
import java.time.LocalDateTime;

public record TransferDifficultyResponse(
	Long id,
	String step,
	String reason,
	Long transferId,
	LocalDateTime occurredAt,
	boolean completed,
	LocalDateTime completedAt
) {

	public static TransferDifficultyResponse from(TransferDifficulty entity) {
		return new TransferDifficultyResponse(
			entity.getDifficultyId(),
			entity.getStep().getCode(),
			entity.getReason() == null ? null : entity.getReason().getCode(),
			entity.getTransferId(),
			entity.getOccurredAt(),
			entity.isCompleted(),
			entity.getCompletedAt()
		);
	}
}
