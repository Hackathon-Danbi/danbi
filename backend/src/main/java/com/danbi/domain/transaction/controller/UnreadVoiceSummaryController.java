package com.danbi.domain.transaction.controller;

import com.danbi.domain.transaction.dto.UnreadVoiceSummaryResponse;
import com.danbi.domain.transaction.service.UnreviewedTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 시연 앱의 "그동안 이런 거래가 있었어요" 음성 요약 API. */
@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
public class UnreadVoiceSummaryController {

	// TODO: 인증 연동 시 로그인한 사용자의 ID로 교체한다.
	private static final Long USER_ID = 1L;

	private final UnreviewedTransactionService service;

	@GetMapping("/unread-summary")
	public UnreadVoiceSummaryResponse unreadSummary() {
		return service.voiceSummary(USER_ID);
	}
}
