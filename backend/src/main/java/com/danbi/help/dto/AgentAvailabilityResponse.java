package com.danbi.help.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

public record AgentAvailabilityResponse(
	boolean available,
	LocalTime opensAt,
	LocalTime closesAt,
	boolean weekdaysOnly,
	/** 조회 시각(Asia/Seoul). */
	LocalDateTime now,
	/** 운영시간 외일 때 다음 상담 가능 일시. 운영 중이면 null. */
	LocalDateTime nextAvailableAt,
	/** 고객센터 전화번호. */
	String supportPhoneNumber,
	/** 운영시간 안내 문구(예: "평일 09:00~18:00"). */
	String operatingHoursText,
	/** 상황별 안내 문구. */
	String message
) {
}
