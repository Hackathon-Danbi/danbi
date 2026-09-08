package com.danbi.domain.help.dto;

import com.danbi.domain.help.entity.HelpSignal;
import com.danbi.domain.help.entity.HelpStage;

public record HelpTriggerResponse(
	boolean show,
	HelpStage helpStage,
	HelpStage previousStage,
	String screenCode,
	HelpSignal signal,
	String reason,
	String message,
	boolean counselor,
	boolean agentAvailable,
	HelpSignalCounts counts
) {

	/** 개입 단계를 노출한다. */
	public static final String SHOW = "SHOW";
	/** 최초 노출 기준 또는 다음 단계 상승 조건이 아직 충족되지 않음. */
	public static final String THRESHOLD_NOT_MET = "THRESHOLD_NOT_MET";
	/** 도움 거절 후 30초 억제 구간(신규 오류/도움요청 예외 아님). */
	public static final String SUPPRESSED_AFTER_REJECT = "SUPPRESSED_AFTER_REJECT";
	/** 이미 COUNSELOR 까지 노출됨. 반복 노출/추가 저장 없음. */
	public static final String FINAL_STAGE_ALREADY_SHOWN = "FINAL_STAGE_ALREADY_SHOWN";
	/** 미해소 RISK_DETECTED 가 있어 일반 도움보다 SAFETY_CHECK 를 우선함. */
	public static final String RISK_DETECTED = "RISK_DETECTED";

	public static HelpTriggerResponse notShown(String reason, String screenCode, HelpSignal signal,
			HelpStage previousStage, HelpSignalCounts counts) {
		return new HelpTriggerResponse(false, null, previousStage, screenCode, signal, reason, null, false, false, counts);
	}
}
