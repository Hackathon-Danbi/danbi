package com.danbi.domain.onboarding.exception;

public class CertificateAlreadyIssuedException extends RuntimeException {
	private static final String ERROR_CODE = "CERTIFICATE_ALREADY_ISSUED";

	public CertificateAlreadyIssuedException() {
		super("이미 발급한 인증서의 간편비밀번호는 변경할 수 없습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
