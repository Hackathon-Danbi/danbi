package com.danbi.help.controller;

import com.danbi.help.dto.AgentAvailabilityResponse;
import com.danbi.help.dto.BehaviorEventRequest;
import com.danbi.help.dto.BehaviorEventResponse;
import com.danbi.help.dto.HelpTriggerRequest;
import com.danbi.help.dto.HelpTriggerResponse;
import com.danbi.help.service.HelpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/help")
@RequiredArgsConstructor
public class HelpController {

	private final HelpService helpService;

	/**
	 * 개입 단계 결정.
	 * POST /api/help/trigger  body: { userId, flowSessionId, flowType, screenCode, signal }
	 * 판단은 flowSessionId 누적으로 하되, 서버가 노출 단계를 기록하므로 userId/flowType 이 필요하다.
	 */
	@PostMapping("/trigger")
	public HelpTriggerResponse trigger(@RequestBody @Valid HelpTriggerRequest request) {
		return helpService.trigger(request.userId(), request.flowSessionId(), request.flowType(),
			request.screenCode(), request.signal());
	}

	/** 행동 이벤트 적재. POST /api/help/behavior-events */
	@PostMapping("/behavior-events")
	@ResponseStatus(HttpStatus.CREATED)
	public BehaviorEventResponse recordEvent(@RequestBody @Valid BehaviorEventRequest request) {
		return helpService.recordEvent(request);
	}

	/** 상담원 운영시간 사전 조회. GET /api/help/agent-availability */
	@GetMapping("/agent-availability")
	public AgentAvailabilityResponse agentAvailability() {
		return helpService.agentAvailability();
	}
}
