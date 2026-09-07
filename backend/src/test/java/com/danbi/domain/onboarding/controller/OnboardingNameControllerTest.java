package com.danbi.domain.onboarding.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.SaveOnboardingNameResponse;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.model.OnboardingStep;
import com.danbi.domain.onboarding.service.OnboardingSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class OnboardingNameControllerTest {

	private MockMvc mockMvc;
	private OnboardingSessionService onboardingSessionService;

	@BeforeEach
	void setUp() {
		onboardingSessionService = mock(OnboardingSessionService.class);
		OnboardingNameController controller = new OnboardingNameController(onboardingSessionService);
		mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
	}

	@Test
	void savesName() throws Exception {
		String onboardingSessionId = "ob_0123456789abcdef0123456789abcdef";
		when(onboardingSessionService.saveName(any())).thenReturn(
			new SaveOnboardingNameResponse(
				onboardingSessionId,
				"홍길동",
				OnboardingStep.PHONE_OWNERSHIP
			)
		);

		mockMvc.perform(post("/api/onboarding/name")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "%s",
					  "name": "홍길동"
					}
					""".formatted(onboardingSessionId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.onboardingSessionId").value(onboardingSessionId))
			.andExpect(jsonPath("$.name").value("홍길동"))
			.andExpect(jsonPath("$.onboardingStep").value("PHONE_OWNERSHIP"));
	}

	@Test
	void rejectsBlankName() throws Exception {
		String onboardingSessionId = "ob_0123456789abcdef0123456789abcdef";

		mockMvc.perform(post("/api/onboarding/name")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "%s",
					  "name": " "
					}
					""".formatted(onboardingSessionId)))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsNotFoundForUnknownSession() throws Exception {
		when(onboardingSessionService.saveName(any()))
			.thenThrow(new OnboardingSessionNotFoundException("ob_missing"));

		mockMvc.perform(post("/api/onboarding/name")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_missing",
					  "name": "홍길동"
					}
					"""))
			.andExpect(status().isNotFound());
	}
}
