package com.danbi.domain.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.ConfirmPhoneVerificationResponse;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationResponse;
import com.danbi.domain.onboarding.dto.ResendPhoneVerificationResponse;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.exception.PhoneVerificationAlreadyCompletedException;
import com.danbi.domain.onboarding.exception.PhoneVerificationAttemptLimitExceededException;
import com.danbi.domain.onboarding.exception.PhoneVerificationRequestLimitExceededException;
import com.danbi.domain.onboarding.exception.PhoneVerificationCodeMismatchException;
import com.danbi.domain.onboarding.exception.PhoneVerificationExpiredException;
import com.danbi.domain.onboarding.exception.PhoneVerificationSessionMismatchException;
import com.danbi.domain.onboarding.exception.PhoneVerificationSessionNotFoundException;
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

	@Test
	void resendsPhoneVerificationCode() throws Exception {
		String onboardingSessionId = "ob_0123456789abcdef0123456789abcdef";
		String verificationSessionId = "pv_0123456789abcdef0123456789abcdef";
		when(phoneVerificationService.resendVerification(any())).thenReturn(
			new ResendPhoneVerificationResponse(
				onboardingSessionId,
				verificationSessionId,
				420,
				3
			)
		);

		mockMvc.perform(post("/api/onboarding/phone/verify/resend")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "%s",
					  "verificationSessionId": "%s"
					}
					""".formatted(onboardingSessionId, verificationSessionId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.onboardingSessionId").value(onboardingSessionId))
			.andExpect(jsonPath("$.verificationSessionId").value(verificationSessionId))
			.andExpect(jsonPath("$.expiresInSeconds").value(420))
			.andExpect(jsonPath("$.remainingRequestCount").value(3));
	}

	@Test
	void returnsTooManyRequestsWhenResendLimitIsExceeded() throws Exception {
		when(phoneVerificationService.resendVerification(any()))
			.thenThrow(new PhoneVerificationRequestLimitExceededException());

		mockMvc.perform(post("/api/onboarding/phone/verify/resend")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_0123456789abcdef0123456789abcdef",
					  "verificationSessionId": "pv_0123456789abcdef0123456789abcdef"
					}
					"""))
			.andExpect(status().isTooManyRequests())
			.andExpect(jsonPath("$.code")
				.value("PHONE_VERIFICATION_REQUEST_LIMIT_EXCEEDED"));
	}

	@Test
	void returnsNotFoundForUnknownVerificationSession() throws Exception {
		when(phoneVerificationService.resendVerification(any()))
			.thenThrow(new PhoneVerificationSessionNotFoundException("pv_missing"));

		mockMvc.perform(post("/api/onboarding/phone/verify/resend")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_0123456789abcdef0123456789abcdef",
					  "verificationSessionId": "pv_missing"
					}
					"""))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code")
				.value("PHONE_VERIFICATION_SESSION_NOT_FOUND"));
	}

	@Test
	void returnsBadRequestForMismatchedSessions() throws Exception {
		when(phoneVerificationService.resendVerification(any()))
			.thenThrow(new PhoneVerificationSessionMismatchException());

		mockMvc.perform(post("/api/onboarding/phone/verify/resend")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_0123456789abcdef0123456789abcdef",
					  "verificationSessionId": "pv_0123456789abcdef0123456789abcdef"
					}
					"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code")
				.value("PHONE_VERIFICATION_SESSION_MISMATCH"));
	}

	@Test
	void confirmsPhoneVerificationCode() throws Exception {
		String onboardingSessionId = "ob_0123456789abcdef0123456789abcdef";
		String verificationSessionId = "pv_0123456789abcdef0123456789abcdef";
		when(phoneVerificationService.confirmVerification(any())).thenReturn(
			new ConfirmPhoneVerificationResponse(
				onboardingSessionId,
				verificationSessionId,
				true,
				OnboardingStep.CERTIFICATE_ISSUANCE
			)
		);

		mockMvc.perform(post("/api/onboarding/phone/verify/confirm")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "%s",
					  "verificationSessionId": "%s",
					  "verificationCode": "381529"
					}
					""".formatted(onboardingSessionId, verificationSessionId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.onboardingSessionId").value(onboardingSessionId))
			.andExpect(jsonPath("$.verificationSessionId").value(verificationSessionId))
			.andExpect(jsonPath("$.identityVerified").value(true))
			.andExpect(jsonPath("$.onboardingStep").value("CERTIFICATE_ISSUANCE"));
	}

	@Test
	void rejectsInvalidVerificationCodeFormat() throws Exception {
		mockMvc.perform(post("/api/onboarding/phone/verify/confirm")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_0123456789abcdef0123456789abcdef",
					  "verificationSessionId": "pv_0123456789abcdef0123456789abcdef",
					  "verificationCode": "12A456"
					}
					"""))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsRemainingAttemptsWhenVerificationCodeDoesNotMatch() throws Exception {
		when(phoneVerificationService.confirmVerification(any()))
			.thenThrow(new PhoneVerificationCodeMismatchException(1));

		mockMvc.perform(post("/api/onboarding/phone/verify/confirm")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_0123456789abcdef0123456789abcdef",
					  "verificationSessionId": "pv_0123456789abcdef0123456789abcdef",
					  "verificationCode": "654321"
					}
					"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("PHONE_VERIFICATION_CODE_MISMATCH"))
			.andExpect(jsonPath("$.remainingAttemptCount").value(1));
	}

	@Test
	void returnsGoneWhenVerificationCodeIsExpired() throws Exception {
		when(phoneVerificationService.confirmVerification(any()))
			.thenThrow(new PhoneVerificationExpiredException());

		mockMvc.perform(post("/api/onboarding/phone/verify/confirm")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_0123456789abcdef0123456789abcdef",
					  "verificationSessionId": "pv_0123456789abcdef0123456789abcdef",
					  "verificationCode": "381529"
					}
					"""))
			.andExpect(status().isGone())
			.andExpect(jsonPath("$.code").value("PHONE_VERIFICATION_EXPIRED"));
	}

	@Test
	void returnsTooManyRequestsAfterFiveFailedAttempts() throws Exception {
		when(phoneVerificationService.confirmVerification(any()))
			.thenThrow(new PhoneVerificationAttemptLimitExceededException());

		mockMvc.perform(post("/api/onboarding/phone/verify/confirm")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_0123456789abcdef0123456789abcdef",
					  "verificationSessionId": "pv_0123456789abcdef0123456789abcdef",
					  "verificationCode": "381529"
					}
					"""))
			.andExpect(status().isTooManyRequests())
			.andExpect(jsonPath("$.code")
				.value("PHONE_VERIFICATION_ATTEMPT_LIMIT_EXCEEDED"))
			.andExpect(jsonPath("$.remainingAttemptCount").value(0));
	}

	@Test
	void returnsConflictWhenVerificationIsAlreadyCompleted() throws Exception {
		when(phoneVerificationService.resendVerification(any()))
			.thenThrow(new PhoneVerificationAlreadyCompletedException());

		mockMvc.perform(post("/api/onboarding/phone/verify/resend")
				.contentType(APPLICATION_JSON)
				.content("""
					{
					  "onboardingSessionId": "ob_0123456789abcdef0123456789abcdef",
					  "verificationSessionId": "pv_0123456789abcdef0123456789abcdef"
					}
					"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code")
				.value("PHONE_VERIFICATION_ALREADY_COMPLETED"));
	}
}
