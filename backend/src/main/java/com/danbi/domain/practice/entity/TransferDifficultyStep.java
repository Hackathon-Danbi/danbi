package com.danbi.domain.practice.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;

/** 프론트 TransferDifficultyStep과 동일한 토큰. */
public enum TransferDifficultyStep {

	RECIPIENT("recipient"),
	BANK("bank"),
	ACCOUNT("account"),
	AMOUNT("amount"),
	REVIEW("review"),
	PASSWORD("password"),
	VOICE("voice");

	/** 허브의 "다시 연습해볼까요?" 카드에 노출하는 단계 (프론트 REVIEWABLE_TRANSFER_STEPS). */
	private static final Set<TransferDifficultyStep> REVIEWABLE =
		EnumSet.of(RECIPIENT, ACCOUNT, AMOUNT, VOICE);

	private final String code;

	TransferDifficultyStep(String code) {
		this.code = code;
	}

	@JsonValue
	public String getCode() {
		return code;
	}

	@JsonCreator
	public static TransferDifficultyStep from(String value) {
		return Arrays.stream(values())
			.filter(step -> step.code.equals(value) || step.name().equalsIgnoreCase(value))
			.findFirst()
			.orElseThrow(() -> new IllegalArgumentException("알 수 없는 송금 단계: " + value));
	}

	public boolean isReviewable() {
		return REVIEWABLE.contains(this);
	}
}
