package com.danbi.domain.practice.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

/**
 * 금융 연습(미션) 완료 저장.
 * {@code missionCode} 는 프론트 MissionId 슬러그. {@code date} 생략 시 서버 오늘 날짜.
 */
public record MissionCompletionRequest(
	@NotBlank String missionCode,
	LocalDate date
) {
}
