package com.danbi.domain.onboarding.exception;

public class IdCardScanNotFoundException extends RuntimeException {
	private static final String ERROR_CODE = "ID_CARD_SCAN_NOT_FOUND";

	public IdCardScanNotFoundException() {
		super("해당 인증서 발급 건의 신분증 인식 정보를 찾을 수 없습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
