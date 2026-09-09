package com.danbi.domain.practice.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;

/** 프론트 MissionType('transfer' | 'phishing-learn' | 'phishing-sim')과 1:1. */
public enum MissionType {

	TRANSFER("transfer"),
	PHISHING_LEARN("phishing-learn"),
	PHISHING_SIM("phishing-sim");

	private final String code;

	MissionType(String code) {
		this.code = code;
	}

	@JsonValue
	public String getCode() {
		return code;
	}

	@JsonCreator
	public static MissionType from(String value) {
		return Arrays.stream(values())
			.filter(type -> type.code.equals(value) || type.name().equalsIgnoreCase(value))
			.findFirst()
			.orElseThrow(() -> new IllegalArgumentException("알 수 없는 연습 유형: " + value));
	}
}
