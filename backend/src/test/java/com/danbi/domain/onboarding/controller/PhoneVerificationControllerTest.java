package com.danbi.domain.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationResponse;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.service.PhoneVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class PhoneVerificationControllerTest {

	private MockMvc mockMvc;
	private PhoneVerificationService phoneVerificationService;

	@BeforeEach
	void setUp() {
		phoneVerificationService = mock(PhoneVerificationService.class);
		PhoneVerificationController controller =
			new PhoneVerificationController(phoneVerificationService);
		mockMvc = MockMvcBuilders.standaloneSetup(controller)
			.setControllerAdvice(new OnboardingExceptionHandler())
			.build();
	}

	@Test
	void requestsPhoneVerification() throws Exception {
		String onboardingSessionId = "ob_0123456789abcdef0123456789abcdef";
		when(phoneVerificationService.requestVerification(any())).thenReturn(
			new RequestPhoneVerificationResponse(
				onboardingSessionId,
				"pv_0123456789abcdef0123456789abcdef",
				420,
				4,
				OnboardingStep.PHONE_VERIFICATION
			)
		);

		mockMvc.perform(post("/api/onboarding/phone/verify/request")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "%s",
					  "carrier": "KT",
					  "phoneNumber": "01012345678"
					}
					""".formatted(onboardingSessionId)))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.onboardingSessionId").value(onboardingSessionId))
			.andExpect(jsonPath("$.verificationSessionId")
				.value("pv_0123456789abcdef0123456789abcdef"))
			.andExpect(jsonPath("$.expiresInSeconds").value(420))
			.andExpect(jsonPath("$.remainingRequestCount").value(4))
			.andExpect(jsonPath("$.onboardingStep").value("PHONE_VERIFICATION"));
	}

	@Test
	void rejectsInvalidPhoneNumber() throws Exception {
		mockMvc.perform(post("/api/onboarding/phone/verify/request")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_0123456789abcdef0123456789abcdef",
					  "carrier": "KT",
					  "phoneNumber": "010-1234-5678"
					}
					"""))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsNotFoundForUnknownOnboardingSession() throws Exception {
		when(phoneVerificationService.requestVerification(any()))
			.thenThrow(new OnboardingSessionNotFoundException("ob_missing"));

		mockMvc.perform(post("/api/onboarding/phone/verify/request")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_missing",
					  "carrier": "KT",
					  "phoneNumber": "01012345678"
					}
					"""))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("ONBOARDING_SESSION_NOT_FOUND"));
	}
}
