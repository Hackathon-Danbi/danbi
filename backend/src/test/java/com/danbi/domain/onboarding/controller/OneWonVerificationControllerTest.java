package com.danbi.domain.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.ConfirmOneWonVerificationResponse;
import com.danbi.domain.onboarding.dto.RequestOneWonVerificationResponse;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.exception.OneWonVerificationRequestLimitExceededException;
import com.danbi.domain.onboarding.exception.OneWonVerificationAttemptLimitExceededException;
import com.danbi.domain.onboarding.exception.OneWonVerificationExpiredException;
import com.danbi.domain.onboarding.service.OneWonVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class OneWonVerificationControllerTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";
	private static final String TARGET_ID = "at_0123456789abcdef0123456789abcdef";

	private MockMvc mockMvc;
	private OneWonVerificationService oneWonVerificationService;

	@BeforeEach
	void setUp() {
		oneWonVerificationService = mock(OneWonVerificationService.class);
		mockMvc = MockMvcBuilders.standaloneSetup(
			new OneWonVerificationController(oneWonVerificationService)
		).setControllerAdvice(new OnboardingExceptionHandler()).build();
	}

	@Test
	void requestsOneWonVerification() throws Exception {
		when(oneWonVerificationService.request(eq(TARGET_ID), any()))
			.thenReturn(new RequestOneWonVerificationResponse(
				ISSUANCE_ID,
				TARGET_ID,
				"av_0123456789abcdef0123456789abcdef",
				300,
				OnboardingStep.ONE_WON_VERIFICATION
			));

		mockMvc.perform(post(endpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody(ISSUANCE_ID)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.issuanceId").value(ISSUANCE_ID))
			.andExpect(jsonPath("$.accountVerificationTargetId").value(TARGET_ID))
			.andExpect(jsonPath("$.verificationId")
				.value("av_0123456789abcdef0123456789abcdef"))
			.andExpect(jsonPath("$.expiresInSeconds").value(300))
			.andExpect(jsonPath("$.onboardingStep").value("ONE_WON_VERIFICATION"));
	}

	@Test
	void rejectsMissingIssuanceId() throws Exception {
		mockMvc.perform(post(endpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsTooManyRequestsAfterLimit() throws Exception {
		when(oneWonVerificationService.request(eq(TARGET_ID), any()))
			.thenThrow(new OneWonVerificationRequestLimitExceededException());

		mockMvc.perform(post(endpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody(ISSUANCE_ID)))
			.andExpect(status().isTooManyRequests())
			.andExpect(jsonPath("$.code")
				.value("ONE_WON_VERIFICATION_REQUEST_LIMIT_EXCEEDED"));
	}

	@Test
	void confirmsOneWonVerification() throws Exception {
		String verificationId = "av_0123456789abcdef0123456789abcdef";
		when(oneWonVerificationService.confirm(eq(TARGET_ID), any()))
			.thenReturn(new ConfirmOneWonVerificationResponse(
				ISSUANCE_ID,
				TARGET_ID,
				verificationId,
				true,
				0,
				5,
				OnboardingStep.PASSWORD_SETUP
			));

		mockMvc.perform(post(confirmEndpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content(confirmRequestBody(verificationId, "4821")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.verified").value(true))
			.andExpect(jsonPath("$.failureCount").value(0))
			.andExpect(jsonPath("$.remainingAttempts").value(5))
			.andExpect(jsonPath("$.onboardingStep").value("PASSWORD_SETUP"));
	}

	@Test
	void rejectsInvalidVerificationCodeFormat() throws Exception {
		mockMvc.perform(post(confirmEndpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content(confirmRequestBody("av_01", "48ab")))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsGoneForExpiredVerification() throws Exception {
		when(oneWonVerificationService.confirm(eq(TARGET_ID), any()))
			.thenThrow(new OneWonVerificationExpiredException());

		mockMvc.perform(post(confirmEndpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content(confirmRequestBody("av_01", "4821")))
			.andExpect(status().isGone())
			.andExpect(jsonPath("$.code").value("ONE_WON_VERIFICATION_EXPIRED"));
	}

	@Test
	void returnsTooManyRequestsOnFifthWrongCode() throws Exception {
		when(oneWonVerificationService.confirm(eq(TARGET_ID), any()))
			.thenThrow(new OneWonVerificationAttemptLimitExceededException(5));

		mockMvc.perform(post(confirmEndpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content(confirmRequestBody("av_01", "0000")))
			.andExpect(status().isTooManyRequests())
			.andExpect(jsonPath("$.code")
				.value("ONE_WON_VERIFICATION_ATTEMPT_LIMIT_EXCEEDED"))
			.andExpect(jsonPath("$.failureCount").value(5))
			.andExpect(jsonPath("$.remainingAttempts").value(0));
	}

	private String endpoint() {
		return "/api/onboarding/certificate/accounts/" + TARGET_ID + "/one-won/request";
	}

	private String confirmEndpoint() {
		return "/api/onboarding/certificate/accounts/" + TARGET_ID + "/one-won/confirm";
	}

	private String requestBody(String issuanceId) {
		return """
			{
			  "issuanceId": "%s"
			}
			""".formatted(issuanceId);
	}

	private String confirmRequestBody(String verificationId, String verificationCode) {
		return """
			{
			  "issuanceId": "%s",
			  "verificationId": "%s",
			  "verificationCode": "%s"
			}
			""".formatted(ISSUANCE_ID, verificationId, verificationCode);
	}
}
