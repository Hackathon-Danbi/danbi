package com.danbi.domain.help.entity;

/**
 * 클라이언트가 로컬 타이머/카운터로 임계값에 도달했을 때 GET /help/trigger 에 넘기는 신호.
 * HELP_MORE_REQUESTED = 사용자가 "도움이 더 필요해요"를 선택.
 */
public enum HelpSignal {
	LONG_STAY,
	IRRELEVANT_CLICK,
	INPUT_ERROR,
	VOICE_FAIL,
	SCREEN_REENTRY,
	HELP_MORE_REQUESTED
}
