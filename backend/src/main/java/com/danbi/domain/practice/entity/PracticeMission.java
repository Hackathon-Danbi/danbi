package com.danbi.domain.practice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

/**
 * 금융 연습(미션) 카탈로그. 점수판(나의 금융 독립 점수)의 배점 기준.
 * ERD의 practice_missions에 프론트 MissionId 매핑용 {@code code} 컬럼을 더한 형태.
 */
@Entity
@Table(
	name = "practice_missions",
	uniqueConstraints = @UniqueConstraint(name = "UK_PRACTICE_MISSIONS_CODE", columnNames = "code")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PracticeMission {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "mission_id")
	private Long missionId;

	/** 프론트 MissionId 슬러그 (예: "guided-transfer"). */
	@Column(name = "code", nullable = false, length = 40)
	private String code;

	@Enumerated(EnumType.STRING)
	@Column(name = "mission_type", nullable = false, length = 30)
	private MissionType missionType;

	@Column(name = "title", nullable = false, length = 100)
	private String title;

	@Column(name = "description", nullable = false, length = 255)
	private String description;

	@Builder.Default
	@ColumnDefault("10")
	@Column(name = "score_reward", nullable = false)
	private int scoreReward = 10;
}
