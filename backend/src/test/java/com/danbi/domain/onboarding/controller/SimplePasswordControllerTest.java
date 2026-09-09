package com.danbi.domain.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.SetSimplePasswordResponse;
import com.danbi.domain.onboarding.exception.CertificateAlreadyIssuedException;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.exception.SimplePasswordMismatchException;
import com.danbi.domain.onboarding.exception.WeakSimplePasswordException;
import com.danbi.domain.onboarding.service.SimplePasswordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SimplePasswordControllerTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";

	private MockMvc mockMvc;
	private SimplePasswordService simplePasswordService;

	@BeforeEach
	void setUp() {
		simplePasswordService = mock(SimplePasswordService.class);
		mockMvc = MockMvcBuilders.standaloneSetup(
			new SimplePasswordController(simplePasswordService)
		).setControllerAdvice(new OnboardingExceptionHandler()).build();
	}

	@Test
	void setsSimplePasswordAndCompletesCertificateIssuance() throws Exception {
		when(simplePasswordService.set(any())).thenReturn(new SetSimplePasswordResponse(
			ISSUANCE_ID,
			true,
			OnboardingStep.COMPLETED
		));

		mockMvc.perform(post("/api/onboarding/certificate/password")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("593817", "593817")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.issuanceId").value(ISSUANCE_ID))
			.andExpect(jsonPath("$.certificateIssued").value(true))
			.andExpect(jsonPath("$.onboardingStep").value("COMPLETED"));
	}

	@Test
	void rejectsPasswordThatIsNotSixDigits() throws Exception {
		mockMvc.perform(post("/api/onboarding/certificate/password")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("1234", "1234")))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsBadRequestForPasswordMismatch() throws Exception {
		when(simplePasswordService.set(any())).thenThrow(new SimplePasswordMismatchException());

		mockMvc.perform(post("/api/onboarding/certificate/password")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("593817", "593818")))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("SIMPLE_PASSWORD_MISMATCH"));
	}

	@Test
	void returnsBadRequestForWeakPassword() throws Exception {
		when(simplePasswordService.set(any())).thenThrow(new WeakSimplePasswordException());

		mockMvc.perform(post("/api/onboarding/certificate/password")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("111111", "111111")))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("WEAK_SIMPLE_PASSWORD"));
	}

	@Test
	void returnsConflictWhenIssuedPasswordWouldChange() throws Exception {
		when(simplePasswordService.set(any())).thenThrow(new CertificateAlreadyIssuedException());

		mockMvc.perform(post("/api/onboarding/certificate/password")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("593817", "593817")))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("CERTIFICATE_ALREADY_ISSUED"));
	}

	private String requestBody(String password, String passwordConfirm) {
		return """
			{
			  "issuanceId": "%s",
			  "password": "%s",
			  "passwordConfirm": "%s"
			}
			""".formatted(ISSUANCE_ID, password, passwordConfirm);
	}
}
