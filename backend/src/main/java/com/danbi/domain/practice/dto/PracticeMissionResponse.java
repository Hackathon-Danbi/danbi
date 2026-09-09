package com.danbi.domain.practice.dto;

import com.danbi.domain.practice.entity.PracticeMission;

/**
 * FE {@code PracticeMission} 계약과 1:1.
 * {@code missionType} 은 enum 코드("transfer")가 아니라 이름("TRANSFER")으로 내보낸다(FE 계약).
 */
public record PracticeMissionResponse(
	Long missionId,
	String missionType,
	String title,
	String description,
	int scoreReward
) {

	public static PracticeMissionResponse from(PracticeMission mission) {
		return new PracticeMissionResponse(
			mission.getMissionId(),
			mission.getMissionType().name(),
			mission.getTitle(),
			mission.getDescription(),
			mission.getScoreReward()
		);
	}
}
