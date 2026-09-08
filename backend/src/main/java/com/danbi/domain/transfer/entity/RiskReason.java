package com.danbi.domain.transfer.entity;

/**
 * 송금 위험 사유와 심각도.
 * BLOCKING - 입력 자체가 잘못됨. 안심확인으로도 통과 불가.
 * SAFETY   - 안심확인(SAFETY_CHECK) 을 완료해야 진행 가능.
 * INFO     - 참고용. 단독으로는 실행을 막지 않음. (현재 사용처 없음)
 *
 * <p>SAFETY_CHECK 대상 위험: NEW_RECIPIENT, HIGH_AMOUNT, REPEATED_TRANSFER, IN_CALL, RUSHED, PHISHING_KEYWORD_DETECTED.
 * 처음 송금하는 계좌(NEW_RECIPIENT)도 단비 안심확인 대상이다.
 */
public enum RiskReason {

	AMOUNT_INVALID(Severity.BLOCKING),
	ACCOUNT_NUMBER_INVALID(Severity.BLOCKING),
	AMOUNT_EXCEEDS_BALANCE(Severity.BLOCKING),

	NEW_RECIPIENT(Severity.SAFETY),
	HIGH_AMOUNT(Severity.SAFETY),
	REPEATED_TRANSFER(Severity.SAFETY),
	IN_CALL(Severity.SAFETY),
	RUSHED(Severity.SAFETY),
	PHISHING_KEYWORD_DETECTED(Severity.SAFETY);

	public enum Severity {
		BLOCKING, SAFETY, INFO
	}

	private final Severity severity;

	RiskReason(Severity severity) {
		this.severity = severity;
	}

	public Severity getSeverity() {
		return severity;
	}

	public boolean isBlocking() {
		return severity == Severity.BLOCKING;
	}

	public boolean isSafety() {
		return severity == Severity.SAFETY;
	}
}
