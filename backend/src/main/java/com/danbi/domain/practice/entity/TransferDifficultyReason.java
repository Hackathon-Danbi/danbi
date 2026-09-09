package com.danbi.domain.practice.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;

/** 프론트 TransferDifficultyReason과 동일한 토큰. 선택값(없을 수 있음). */
public enum TransferDifficultyReason {

	INACTIVITY("inactivity"),
	INPUT_ERROR("inputError"),
	WRONG_CLICK("wrongClick"),
	VOICE_FAILURE("voiceFailure"),
	REENTRY("reentry");

	private final String code;

	TransferDifficultyReason(String code) {
		this.code = code;
	}

	@JsonValue
	public String getCode() {
		return code;
	}

	@JsonCreator
	public static TransferDifficultyReason from(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return Arrays.stream(values())
			.filter(reason -> reason.code.equals(value) || reason.name().equalsIgnoreCase(value))
			.findFirst()
			.orElseThrow(() -> new IllegalArgumentException("알 수 없는 어려움 사유: " + value));
	}
}
