package com.danbi.domain.practice.controller;

import com.danbi.domain.practice.dto.PracticeMissionsResponse;
import com.danbi.domain.practice.service.PracticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 연습모드 카탈로그 API. FE {@code practiceApi} 와 계약을 맞춘다.
 *
 * <p>세션 기반 실전 송금 연습({@code POST /api/practice/sessions} 이하)과 음성 인식은
 * 이 커밋 범위 밖이다(별도 기능).
 */
@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

	private final PracticeService practiceService;

	/** 송금 연습 목록. GET /api/practice/missions → { "missions": [...] } */
	@GetMapping("/missions")
	public PracticeMissionsResponse missions() {
		return practiceService.listTransferMissions();
	}
}
