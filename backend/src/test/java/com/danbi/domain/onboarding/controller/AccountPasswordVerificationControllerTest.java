package com.danbi.domain.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.VerifyAccountPasswordResponse;
import com.danbi.domain.onboarding.exception.AccountPasswordVerificationLockedException;
import com.danbi.domain.onboarding.exception.AccountVerificationTargetNotFoundException;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.service.AccountPasswordVerificationService;
import com.danbi.domain.onboarding.service.AccountVerificationTargetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AccountPasswordVerificationControllerTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";
	private static final String TARGET_ID = "at_0123456789abcdef0123456789abcdef";

	private MockMvc mockMvc;
	private AccountPasswordVerificationService accountPasswordVerificationService;

	@BeforeEach
	void setUp() {
		AccountVerificationTargetService accountVerificationTargetService = mock(
			AccountVerificationTargetService.class
		);
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
	void verifiesAccountPassword() throws Exception {
		when(accountPasswordVerificationService.verify(eq(TARGET_ID), any()))
			.thenReturn(new VerifyAccountPasswordResponse(
				ISSUANCE_ID,
				TARGET_ID,
				true,
				0,
				5,
				OnboardingStep.PASSWORD_SETUP
			));

		mockMvc.perform(post(endpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("1234")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.issuanceId").value(ISSUANCE_ID))
			.andExpect(jsonPath("$.accountVerificationTargetId").value(TARGET_ID))
			.andExpect(jsonPath("$.verified").value(true))
			.andExpect(jsonPath("$.failureCount").value(0))
			.andExpect(jsonPath("$.remainingAttempts").value(5))
			.andExpect(jsonPath("$.onboardingStep").value("PASSWORD_SETUP"));
	}

	@Test
	void rejectsPasswordThatIsNotFourDigits() throws Exception {
		mockMvc.perform(post(endpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("12ab")))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsNotFoundForUnknownTarget() throws Exception {
		when(accountPasswordVerificationService.verify(eq(TARGET_ID), any()))
			.thenThrow(new AccountVerificationTargetNotFoundException(TARGET_ID));

		mockMvc.perform(post(endpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("1234")))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code")
				.value("ACCOUNT_VERIFICATION_TARGET_NOT_FOUND"));
	}

	@Test
	void returnsLockedOnFifthFailure() throws Exception {
		when(accountPasswordVerificationService.verify(eq(TARGET_ID), any()))
			.thenThrow(new AccountPasswordVerificationLockedException(5));

		mockMvc.perform(post(endpoint())
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody("0000")))
			.andExpect(status().isLocked())
			.andExpect(jsonPath("$.code")
				.value("ACCOUNT_PASSWORD_VERIFICATION_LOCKED"))
			.andExpect(jsonPath("$.failureCount").value(5))
			.andExpect(jsonPath("$.remainingAttempts").value(0));
	}

	private String endpoint() {
		return "/api/onboarding/certificate/accounts/" + TARGET_ID + "/password/verify";
	}

	private String requestBody(String accountPassword) {
		return """
			{
			  "issuanceId": "%s",
			  "accountPassword": "%s"
			}
			""".formatted(ISSUANCE_ID, accountPassword);
	}
}
