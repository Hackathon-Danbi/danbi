package com.danbi.domain.onboarding.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.GetOnboardingCompletionResponse;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.exception.OnboardingCompletionConflictException;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.service.OnboardingCompletionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class OnboardingCompletionControllerTest {

	private static final String ONBOARDING_SESSION_ID =
		"ob_0123456789abcdef0123456789abcdef";

	private MockMvc mockMvc;
	private OnboardingCompletionService onboardingCompletionService;

	@BeforeEach
	void setUp() {
		onboardingCompletionService = org.mockito.Mockito.mock(
			OnboardingCompletionService.class
		);
		mockMvc = MockMvcBuilders.standaloneSetup(
			new OnboardingCompletionController(onboardingCompletionService)
		).setControllerAdvice(new OnboardingExceptionHandler()).build();
	}

	@Test
	void getsOnboardingCompletionInformation() throws Exception {
		when(onboardingCompletionService.get(ONBOARDING_SESSION_ID)).thenReturn(
			new GetOnboardingCompletionResponse(
				ONBOARDING_SESSION_ID,
				7L,
				"박옥순",
				true,
				OnboardingStep.COMPLETED
			)
		);

		mockMvc.perform(get("/api/onboarding/complete")
				.param("onboardingSessionId", ONBOARDING_SESSION_ID))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.onboardingSessionId")
				.value(ONBOARDING_SESSION_ID))
			.andExpect(jsonPath("$.userId").value(7L))
			.andExpect(jsonPath("$.name").value("박옥순"))
			.andExpect(jsonPath("$.certificateIssued").value(true))
			.andExpect(jsonPath("$.onboardingStep").value("COMPLETED"));
	}

	@Test
	void returnsBadRequestWhenSessionIdIsMissing() throws Exception {
		mockMvc.perform(get("/api/onboarding/complete"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsNotFoundForUnknownSession() throws Exception {
		when(onboardingCompletionService.get(ONBOARDING_SESSION_ID))
			.thenThrow(new OnboardingSessionNotFoundException(ONBOARDING_SESSION_ID));

		mockMvc.perform(get("/api/onboarding/complete")
				.param("onboardingSessionId", ONBOARDING_SESSION_ID))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code")
				.value("ONBOARDING_SESSION_NOT_FOUND"));
	}

	@Test
	void returnsConflictForIncompleteOnboarding() throws Exception {
		when(onboardingCompletionService.get(ONBOARDING_SESSION_ID))
			.thenThrow(new OnboardingCompletionConflictException(
				"가입 또는 국민인증서 발급이 완료되지 않았습니다."
			));

		mockMvc.perform(get("/api/onboarding/complete")
				.param("onboardingSessionId", ONBOARDING_SESSION_ID))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("ONBOARDING_NOT_COMPLETED"));
	}
}
