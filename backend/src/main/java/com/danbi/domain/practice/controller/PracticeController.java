package com.danbi.domain.practice.controller;

import com.danbi.domain.practice.dto.CreatePracticeSessionRequest;
import com.danbi.domain.practice.dto.PracticeAccountsResponse;
import com.danbi.domain.practice.dto.PracticeMissionsResponse;
import com.danbi.domain.practice.dto.PracticeSessionResponse;
import com.danbi.domain.practice.dto.PracticeSessionResultResponse;
import com.danbi.domain.practice.dto.PracticeTransferRequest;
import com.danbi.domain.practice.dto.PracticeTransferResultResponse;
import com.danbi.domain.practice.service.PracticeService;
import com.danbi.domain.practice.service.PracticeSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 연습모드 API. FE {@code practiceApi} 와 계약을 맞춘다.
 *
 * <p>세션 기반 연습 송금은 실제 돈을 움직이지 않고 미션 배점만 기록한다.
 * 음성 인식({@code POST /api/practice/voice/recognize})은 기기 STT가 주 경로라 이 범위 밖이다.
 */
@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

	private final PracticeService practiceService;
	private final PracticeSessionService practiceSessionService;

	/** 송금 연습 목록. GET /api/practice/missions → { "missions": [...] } */
	@GetMapping("/missions")
	public PracticeMissionsResponse missions() {
		return practiceService.listTransferMissions();
	}

	/** 연습 세션 생성. POST /api/practice/sessions */
	@PostMapping("/sessions")
	public PracticeSessionResponse createSession(@Valid @RequestBody CreatePracticeSessionRequest request) {
		return practiceSessionService.create(request);
	}

	/** 연습용 가상 수취인 목록. GET /api/practice/accounts */
	@GetMapping("/accounts")
	public PracticeAccountsResponse accounts() {
		return practiceSessionService.listPracticeAccounts();
	}

	/** 연습 송금 완료(실제 이체 없음). POST /api/practice/sessions/{sessionId}/transfer */
	@PostMapping("/sessions/{sessionId}/transfer")
	public PracticeTransferResultResponse transfer(
		@PathVariable String sessionId,
		@Valid @RequestBody PracticeTransferRequest request
	) {
		return practiceSessionService.completeTransfer(sessionId, request);
	}

	/** 연습 세션 결과. GET /api/practice/sessions/{sessionId}/result */
	@GetMapping("/sessions/{sessionId}/result")
	public PracticeSessionResultResponse result(@PathVariable String sessionId) {
		return practiceSessionService.getResult(sessionId);
	}
}
