package com.danbi.domain.practice.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.practice.dto.CompletePracticeRequest;
import com.danbi.domain.practice.dto.PracticeCompletionResult;
import com.danbi.domain.practice.dto.QuizAnswerRequest;
import com.danbi.domain.practice.dto.QuizAnswerResult;
import com.danbi.domain.practice.dto.TodayDailyActivityResponse;
import com.danbi.domain.practice.service.PracticeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/** FE {@code financialIndependenceApi} 계약(경로·바디·응답 JSON) 검증. */
class DailyActivityControllerTest {

	private PracticeService practiceService;
	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		practiceService = mock(PracticeService.class);
		mockMvc = MockMvcBuilders.standaloneSetup(new DailyActivityController(practiceService)).build();
	}

	@Test
	void today_defaultsUserToOne_andReturnsFeShape() throws Exception {
		when(practiceService.getToday(1L)).thenReturn(new TodayDailyActivityResponse(
			42L,
			"2026-09-09",
			new TodayDailyActivityResponse.Question(9L, "질문", null),
			new TodayDailyActivityResponse.Mission(1L, "TRANSFER", "단계별로 송금 따라하기", "설명", 10),
			false,
			0
		));

		mockMvc.perform(get("/api/daily-activities/today"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.dailyActivityId").value(42))
			.andExpect(jsonPath("$.activityDate").value("2026-09-09"))
			.andExpect(jsonPath("$.question.questionId").value(9))
			.andExpect(jsonPath("$.question.selectedAnswer").doesNotExist())
			.andExpect(jsonPath("$.mission.missionType").value("TRANSFER"))
			.andExpect(jsonPath("$.mission.scoreReward").value(10))
			.andExpect(jsonPath("$.practiceCompleted").value(false))
			.andExpect(jsonPath("$.earnedScore").value(0));
	}

	@Test
	void answer_bindsSelectedAnswerBoolean_andReturnsResult() throws Exception {
		when(practiceService.answerQuiz(eq(42L), any(QuizAnswerRequest.class)))
			.thenReturn(new QuizAnswerResult(9L, true, false, false, "설명", 0));

		mockMvc.perform(post("/api/daily-activities/42/answer")
				.contentType("application/json")
				.content("{\"selectedAnswer\":true}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.questionId").value(9))
			.andExpect(jsonPath("$.selectedAnswer").value(true))
			.andExpect(jsonPath("$.correct").value(false))
			.andExpect(jsonPath("$.correctAnswer").value(false))
			.andExpect(jsonPath("$.explanation").value("설명"));
	}

	@Test
	void answer_missingSelectedAnswer_is400() throws Exception {
		mockMvc.perform(post("/api/daily-activities/42/answer")
				.contentType("application/json")
				.content("{}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void practice_patch_bindsMissionId_andReturnsResult() throws Exception {
		when(practiceService.completePractice(eq(42L), any(CompletePracticeRequest.class)))
			.thenReturn(new PracticeCompletionResult(42L, 1L, true, 10));

		mockMvc.perform(patch("/api/daily-activities/42/practice")
				.contentType("application/json")
				.content("{\"missionId\":1,\"practiceCompleted\":true}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.dailyActivityId").value(42))
			.andExpect(jsonPath("$.missionId").value(1))
			.andExpect(jsonPath("$.practiceCompleted").value(true))
			.andExpect(jsonPath("$.earnedScore").value(10));
	}
}
