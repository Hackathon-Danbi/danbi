package com.danbi.domain.practice.controller;

import com.danbi.domain.practice.dto.CompletePracticeRequest;
import com.danbi.domain.practice.dto.PracticeCompletionResult;
import com.danbi.domain.practice.dto.QuizAnswerRequest;
import com.danbi.domain.practice.dto.QuizAnswerResult;
import com.danbi.domain.practice.dto.TodayDailyActivityResponse;
import com.danbi.domain.practice.service.PracticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * "오늘의 금융 활동" API. FE {@code financialIndependenceApi} 와 계약을 맞춘다.
 * 로그인 도입 전까지 사용자 식별은 {@code userId} 쿼리 파라미터(기본 1 = 데모 사용자).
 */
@RestController
@RequestMapping("/api/daily-activities")
@RequiredArgsConstructor
public class DailyActivityController {

	private final PracticeService practiceService;

	/** 오늘 활동 조회(없으면 생성). GET /api/daily-activities/today?userId=1 */
	@GetMapping("/today")
	public TodayDailyActivityResponse today(@RequestParam(defaultValue = "1") Long userId) {
		return practiceService.getToday(userId);
	}

	/**
	 * 오늘의 금융 한 문제 응답. 하루 1회, 멱등.
	 * POST /api/daily-activities/{dailyActivityId}/answer  body: { "selectedAnswer": true }
	 */
	@PostMapping("/{dailyActivityId}/answer")
	public QuizAnswerResult answer(
		@PathVariable Long dailyActivityId,
		@RequestBody @Valid QuizAnswerRequest request) {
		return practiceService.answerQuiz(dailyActivityId, request);
	}

	/**
	 * 금융 연습 완료. 점수는 미션당 최초 1회만.
	 * PATCH /api/daily-activities/{dailyActivityId}/practice  body: { "missionId": 1, "practiceCompleted": true }
	 */
	@PatchMapping("/{dailyActivityId}/practice")
	public PracticeCompletionResult practice(
		@PathVariable Long dailyActivityId,
		@RequestBody @Valid CompletePracticeRequest request) {
		return practiceService.completePractice(dailyActivityId, request);
	}
}
