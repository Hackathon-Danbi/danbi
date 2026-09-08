package com.danbi.help.dto;

/** 현재 flowSession + 화면 기준 신호별 누적 횟수(데모/디버깅 노출용). */
public record HelpSignalCounts(
	long irrelevantClick,
	long inputError,
	long voiceFail,
	long screenReentry
) {
}
