package com.danbi.domain.onboarding.exception;

public class CertificateIssuanceNotFoundException extends RuntimeException {
	private static final String ERROR_CODE = "CERTIFICATE_ISSUANCE_NOT_FOUND";

	public CertificateIssuanceNotFoundException(String issuanceId) {
		super("인증서 발급 세션을 찾을 수 없습니다: " + issuanceId);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
