package com.danbi.domain.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.SaveAccountVerificationTargetResponse;
import com.danbi.domain.onboarding.entity.AccountVerificationMethod;
import com.danbi.domain.onboarding.exception.AccountVerificationConflictException;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.exception.UnsupportedBankException;
import com.danbi.domain.onboarding.service.AccountPasswordVerificationService;
import com.danbi.domain.onboarding.service.AccountVerificationTargetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AccountVerificationTargetControllerTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";
	private static final String TARGET_ID = "at_0123456789abcdef0123456789abcdef";

	private MockMvc mockMvc;
	private AccountVerificationTargetService accountVerificationTargetService;
	private AccountPasswordVerificationService accountPasswordVerificationService;

	@BeforeEach
	void setUp() {
		accountVerificationTargetService = mock(AccountVerificationTargetService.class);
		accountPasswordVerificationService = mock(AccountPasswordVerificationService.class);
		AccountVerificationTargetController controller = new AccountVerificationTargetController(
			accountVerificationTargetService,
			accountPasswordVerificationService
		);
		mockMvc = MockMvcBuilders.standaloneSetup(controller)
			.setControllerAdvice(new OnboardingExceptionHandler())
			.build();
	}

	@Test
	void savesAccountVerificationTarget() throws Exception {
		when(accountVerificationTargetService.save(any())).thenReturn(
			new SaveAccountVerificationTargetResponse(
				ISSUANCE_ID,
				TARGET_ID,
				"004",
				"KB국민은행",
				"**********1234",
				AccountVerificationMethod.ACCOUNT_PASSWORD,
				OnboardingStep.ACCOUNT_PASSWORD_VERIFICATION
			)
		);

		mockMvc.perform(post("/api/onboarding/certificate/accounts")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("004", "12345678901234")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.issuanceId").value(ISSUANCE_ID))
			.andExpect(jsonPath("$.accountVerificationTargetId").value(TARGET_ID))
			.andExpect(jsonPath("$.bankCode").value("004"))
			.andExpect(jsonPath("$.bankName").value("KB국민은행"))
			.andExpect(jsonPath("$.maskedAccountNumber").value("**********1234"))
			.andExpect(jsonPath("$.verificationMethod").value("ACCOUNT_PASSWORD"))
			.andExpect(jsonPath("$.onboardingStep")
				.value("ACCOUNT_PASSWORD_VERIFICATION"));
	}

	@Test
	void rejectsInvalidAccountNumberFormat() throws Exception {
		mockMvc.perform(post("/api/onboarding/certificate/accounts")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("004", "1234-5678")))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsBadRequestForUnsupportedBank() throws Exception {
		when(accountVerificationTargetService.save(any()))
			.thenThrow(new UnsupportedBankException("999"));

		mockMvc.perform(post("/api/onboarding/certificate/accounts")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("999", "1234567890")))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("UNSUPPORTED_BANK"));
	}

	@Test
	void returnsConflictWhenFaceVerificationIsIncomplete() throws Exception {
		when(accountVerificationTargetService.save(any()))
			.thenThrow(new AccountVerificationConflictException("얼굴 인증이 필요합니다."));

		mockMvc.perform(post("/api/onboarding/certificate/accounts")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("004", "1234567890")))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("ACCOUNT_VERIFICATION_CONFLICT"));
	}

	private String requestBody(String bankCode, String accountNumber) {
		return """
			{
			  "issuanceId": "%s",
			  "bankCode": "%s",
			  "accountNumber": "%s"
			}
			""".formatted(ISSUANCE_ID, bankCode, accountNumber);
	}
}
