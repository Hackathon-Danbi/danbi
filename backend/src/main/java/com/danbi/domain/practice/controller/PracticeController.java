package com.danbi.domain.practice.controller;

import com.danbi.domain.practice.dto.MissionCompletionRequest;
import com.danbi.domain.practice.dto.MissionCompletionResponse;
import com.danbi.domain.practice.dto.PracticeHubResponse;
import com.danbi.domain.practice.dto.QuizAnswerRequest;
import com.danbi.domain.practice.dto.QuizAnswerResponse;
import com.danbi.domain.practice.service.PracticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * "나의 금융 독립"(연습모드 허브) API.
 * 로그인 도입 전까지 사용자 식별은 {@code userId} 쿼리 파라미터(기본값 1 = 데모 사용자).
 */
@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

	private final PracticeService practiceService;

	/** 허브 화면 한 번에 조회. GET /api/practice/hub?userId=1 */
	@GetMapping("/hub")
	public PracticeHubResponse hub(@RequestParam(defaultValue = "1") Long userId) {
		return practiceService.getHub(userId);
	}

	/**
	 * 오늘의 금융 한 문제 응답 저장. 하루 1회, 멱등.
	 * POST /api/practice/quiz/answers?userId=1
	 * body: { "questionId": 9, "answeredIndex": 0, "date": "2026-09-09" }
	 */
	@PostMapping("/quiz/answers")
	public QuizAnswerResponse answerQuiz(
		@RequestParam(defaultValue = "1") Long userId,
		@RequestBody @Valid QuizAnswerRequest request) {
		return practiceService.answerQuiz(userId, request);
	}

	/**
	 * 금융 연습(미션) 완료 저장. 점수는 미션당 최초 1회만.
	 * POST /api/practice/missions/completions?userId=1
	 * body: { "missionCode": "guided-transfer", "date": "2026-09-09" }
	 */
	@PostMapping("/missions/completions")
	public MissionCompletionResponse completeMission(
		@RequestParam(defaultValue = "1") Long userId,
		@RequestBody @Valid MissionCompletionRequest request) {
		return practiceService.completeMission(userId, request);
	}
}
