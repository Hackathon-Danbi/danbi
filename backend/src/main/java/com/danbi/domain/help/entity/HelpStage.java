package com.danbi.domain.help.entity;

/**
 * 개입 단계.
 * HIGHLIGHT    - 1단계: 화면 요소 강조(반짝임)
 * VOICE        - 2단계: 음성 안내 + 문구
 * COUNSELOR    - 3단계: 상담원 연결
 * SAFETY_CHECK - 이상거래 감지 시 안심확인(스테이지 에스컬레이션과는 별개)
 */
public enum HelpStage {
	HIGHLIGHT,
	VOICE,
	COUNSELOR,
	SAFETY_CHECK;

	/** 멈춤 에스컬레이션(강조→음성→상담원)에 쓰이는 단계인지. */
	public boolean isEscalation() {
		return this == HIGHLIGHT || this == VOICE || this == COUNSELOR;
	}
}
