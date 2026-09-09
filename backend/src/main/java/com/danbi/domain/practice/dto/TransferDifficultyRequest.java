package com.danbi.domain.practice.dto;

import com.danbi.domain.practice.entity.TransferDifficultyReason;
import com.danbi.domain.practice.entity.TransferDifficultyStep;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 실제 송금에서 사용자가 막힌 지점 적재.
 * {@code occurredAt} 생략 시 서버 현재 시각.
 */
public record TransferDifficultyRequest(
	@NotNull TransferDifficultyStep step,
	TransferDifficultyReason reason,
	Long transferId,
	LocalDateTime occurredAt
) {
}
