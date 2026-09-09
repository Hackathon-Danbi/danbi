package com.danbi.domain.practice.dto;

import java.util.List;

/** FE {@code practiceApi.getMissions} 는 {@code { missions: [...] }} 래퍼를 기대한다. */
public record PracticeMissionsResponse(
	List<PracticeMissionResponse> missions
) {
}
