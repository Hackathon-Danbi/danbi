package com.danbi.domain.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.StartCertificateIssuanceResponse;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.exception.PhoneVerificationRequiredException;
import com.danbi.domain.onboarding.service.CertificateIssuanceService;
import com.danbi.domain.onboarding.service.CertificateIssuanceStartResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CertificateIssuanceControllerTest {

	private static final String ONBOARDING_SESSION_ID =
		"ob_0123456789abcdef0123456789abcdef";
	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";

	private MockMvc mockMvc;
	private CertificateIssuanceService certificateIssuanceService;

	@BeforeEach
	void setUp() {
		certificateIssuanceService = mock(CertificateIssuanceService.class);
		CertificateIssuanceController controller =
			new CertificateIssuanceController(certificateIssuanceService);
		mockMvc = MockMvcBuilders.standaloneSetup(controller)
			.setControllerAdvice(new OnboardingExceptionHandler())
			.build();
	}

	@Test
	void startsCertificateIssuance() throws Exception {
		when(certificateIssuanceService.start(any())).thenReturn(result(true));

		mockMvc.perform(post("/api/onboarding/certificate/issuance")
				.contentType(APPLICATION_JSON)
				.content(validRequest()))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.onboardingSessionId").value(ONBOARDING_SESSION_ID))
			.andExpect(jsonPath("$.issuanceId").value(ISSUANCE_ID))
			.andExpect(jsonPath("$.onboardingStep").value("CERTIFICATE_TERMS"));
	}

	@Test
	void returnsExistingIssuanceForRepeatedRequest() throws Exception {
		when(certificateIssuanceService.start(any())).thenReturn(result(false));

		mockMvc.perform(post("/api/onboarding/certificate/issuance")
				.contentType(APPLICATION_JSON)
				.content(validRequest()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.issuanceId").value(ISSUANCE_ID));
	}

	@Test
	void rejectsMissingOnboardingSessionId() throws Exception {
		mockMvc.perform(post("/api/onboarding/certificate/issuance")
				.contentType(APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsConflictWhenPhoneVerificationIsIncomplete() throws Exception {
		when(certificateIssuanceService.start(any()))
			.thenThrow(new PhoneVerificationRequiredException());

		mockMvc.perform(post("/api/onboarding/certificate/issuance")
				.contentType(APPLICATION_JSON)
				.content(validRequest()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("PHONE_VERIFICATION_REQUIRED"));
	}

	private CertificateIssuanceStartResult result(boolean created) {
		return new CertificateIssuanceStartResult(
			new StartCertificateIssuanceResponse(
				ONBOARDING_SESSION_ID,
				ISSUANCE_ID,
				OnboardingStep.CERTIFICATE_TERMS
			),
			created
		);
	}

	private String validRequest() {
		return """
			{
			  "onboardingSessionId": "%s"
			}
			""".formatted(ONBOARDING_SESSION_ID);
	}
}
