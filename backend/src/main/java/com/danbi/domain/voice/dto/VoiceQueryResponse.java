package com.danbi.domain.voice.dto;

/** FE {@code VoiceQueryResult} 계약과 1:1. audioUrl 은 항상 null(기기 TTS 사용). */
public record VoiceQueryResponse(
	String answerText,
	String audioUrl,
	Long relatedAccountId
) {

	public static VoiceQueryResponse of(String answerText, Long relatedAccountId) {
		return new VoiceQueryResponse(answerText, null, relatedAccountId);
	}
}
