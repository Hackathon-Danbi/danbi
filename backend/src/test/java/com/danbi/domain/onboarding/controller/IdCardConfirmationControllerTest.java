package com.danbi.domain.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.ConfirmIdCardResponse;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.exception.IdCardConfirmationConflictException;
import com.danbi.domain.onboarding.exception.IdCardScanNotFoundException;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.service.IdCardScanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class IdCardConfirmationControllerTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";
	private static final String SCAN_ID = "scan_0123456789abcdef0123456789abcdef";

	private MockMvc mockMvc;
	private IdCardScanService idCardScanService;

	@BeforeEach
	void setUp() {
		idCardScanService = mock(IdCardScanService.class);
		IdCardScanController controller = new IdCardScanController(idCardScanService);
		mockMvc = MockMvcBuilders.standaloneSetup(controller)
			.setControllerAdvice(new OnboardingExceptionHandler())
			.build();
	}

	@Test
	void confirmsRecognizedIdCardInformation() throws Exception {
		when(idCardScanService.confirm(any())).thenReturn(
			new ConfirmIdCardResponse(
				ISSUANCE_ID,
				SCAN_ID,
				true,
				OnboardingStep.FACE_VERIFICATION
			)
		);

		mockMvc.perform(post("/api/onboarding/certificate/id-card/confirm")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody(true)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.issuanceId").value(ISSUANCE_ID))
			.andExpect(jsonPath("$.scanId").value(SCAN_ID))
			.andExpect(jsonPath("$.confirmed").value(true))
			.andExpect(jsonPath("$.onboardingStep").value("FACE_VERIFICATION"));
	}

	@Test
	void rejectsMissingConfirmationValue() throws Exception {
		mockMvc.perform(post("/api/onboarding/certificate/id-card/confirm")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "issuanceId": "%s",
					  "scanId": "%s"
					}
					""".formatted(ISSUANCE_ID, SCAN_ID)))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsNotFoundWhenScanDoesNotBelongToIssuance() throws Exception {
		when(idCardScanService.confirm(any())).thenThrow(new IdCardScanNotFoundException());

		mockMvc.perform(post("/api/onboarding/certificate/id-card/confirm")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody(true)))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("ID_CARD_SCAN_NOT_FOUND"));
	}

	@Test
	void returnsConflictWhenDecisionCannotBeChanged() throws Exception {
		when(idCardScanService.confirm(any()))
			.thenThrow(new IdCardConfirmationConflictException());

		mockMvc.perform(post("/api/onboarding/certificate/id-card/confirm")
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody(false)))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("ID_CARD_CONFIRMATION_CONFLICT"));
	}

	private String requestBody(boolean confirmed) {
		return """
			{
			  "issuanceId": "%s",
			  "scanId": "%s",
			  "confirmed": %s
			}
			""".formatted(ISSUANCE_ID, SCAN_ID, confirmed);
	}
}
