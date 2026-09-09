package com.danbi.domain.voice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** FE {@code voiceApi.query} body: { queryText }. accountId 는 보내지 않으므로 서버가 데모 계좌를 쓴다. */
public record VoiceQueryRequest(
	@NotBlank @Size(max = 300) String queryText
) {
}
