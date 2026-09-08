package com.danbi.domain.help.entity;

/** 화면을 넘나드는 하나의 시도(flowSession) 안에서 관측되는 행동/상태 이벤트. */
public enum EventType {
	SCREEN_ENTER,
	LONG_STAY,
	IRRELEVANT_CLICK,
	INPUT_ERROR,
	VOICE_FAIL,
	SCREEN_REENTRY,
	AUTH_FAIL,
	RISK_DETECTED,
	/** 서버가 개입 단계를 노출하기로 결정하고 기록하는 이벤트. */
	HELP_SHOWN,
	/** 사용자가 개입 UI에서 실제로 응답(수락/거절/더 필요)한 이벤트. */
	HELP_RESPONSE,
	FLOW_COMPLETED,
	FLOW_CANCELLED
}
