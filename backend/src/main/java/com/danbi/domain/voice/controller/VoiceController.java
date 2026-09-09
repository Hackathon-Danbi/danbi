package com.danbi.domain.voice.controller;

import com.danbi.domain.voice.dto.VoiceQueryRequest;
import com.danbi.domain.voice.dto.VoiceQueryResponse;
import com.danbi.domain.voice.service.VoiceQueryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 홈 마이크 음성 질의. FE {@code voiceApi.query} 계약. */
@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
public class VoiceController {

	private final VoiceQueryService voiceQueryService;

	/** POST /api/voice/query  body: { queryText } → { answerText, audioUrl, relatedAccountId } */
	@PostMapping("/query")
	public VoiceQueryResponse query(@Valid @RequestBody VoiceQueryRequest request) {
		return voiceQueryService.answer(request.queryText());
	}
}
