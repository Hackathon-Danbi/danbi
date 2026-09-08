package com.danbi.domain.help.entity;

/**
 * 사용자가 개입 UI(HELP_RESPONSE 이벤트)에서 남기는 응답 코드.
 * 문자열 비교 대신 이 enum 으로만 판정한다.
 */
public enum HelpUserResponse {

	/** 도움 수락 */
	ACCEPTED,
	/** 상담원/음성 등 추가 도움 요청 */
	NEED_MORE,

	/** --- 도움 거절 계열 (30초 재노출 억제) --- */
	REJECTED,
	CONTINUE_ALONE,
	CLOSE_HELP,

	/** --- 이상 송금 안심확인(SAFETY_CHECK) 해소 계열 --- */
	SAFETY_CONFIRMED,
	TRANSFER_PAUSED,
	ASK_COUNSELOR;

	/** 일반 도움을 거절한 응답인지. */
	public boolean isRejection() {
		return this == REJECTED || this == CONTINUE_ALONE || this == CLOSE_HELP;
	}

	/** SAFETY_CHECK 를 해소(확인 완료 또는 송금 중단)한 응답인지. */
	public boolean isSafetyResolution() {
		return this == SAFETY_CONFIRMED || this == TRANSFER_PAUSED || this == ASK_COUNSELOR;
	}
}
