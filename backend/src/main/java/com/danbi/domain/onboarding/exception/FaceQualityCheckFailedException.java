package com.danbi.domain.onboarding.exception;

public class FaceQualityCheckFailedException extends RuntimeException {
	private static final String ERROR_CODE = "FACE_QUALITY_CHECK_FAILED";

	public FaceQualityCheckFailedException() {
		super("얼굴 촬영 품질을 확인할 수 없습니다. 같은 단계에서 다시 촬영해주세요.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
