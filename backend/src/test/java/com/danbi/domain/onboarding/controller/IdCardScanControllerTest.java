package com.danbi.domain.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.ScanIdCardResponse;
import com.danbi.domain.onboarding.entity.IdCardType;
import com.danbi.domain.onboarding.exception.IdCardRecognitionFailedException;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.service.IdCardScanService;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class IdCardScanControllerTest {

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
	void scansIdCardImage() throws Exception {
		when(idCardScanService.scan(anyString(), any(), any())).thenReturn(
			new ScanIdCardResponse(
				ISSUANCE_ID,
				SCAN_ID,
				IdCardType.RESIDENT_CARD,
				"박옥순",
				"900101-1******",
				LocalDate.of(2020, 3, 12),
				OnboardingStep.ID_CARD_CONFIRMATION
			)
		);

		mockMvc.perform(multipart("/api/onboarding/certificate/id-card/scan")
				.file(jpegImage())
				.param("issuanceId", ISSUANCE_ID)
				.param("idCardType", "RESIDENT_CARD"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.issuanceId").value(ISSUANCE_ID))
			.andExpect(jsonPath("$.scanId").value(SCAN_ID))
			.andExpect(jsonPath("$.idCardType").value("RESIDENT_CARD"))
			.andExpect(jsonPath("$.recognizedName").value("박옥순"))
			.andExpect(jsonPath("$.maskedIdNumber").value("900101-1******"))
			.andExpect(jsonPath("$.issueDate").value("2020-03-12"))
			.andExpect(jsonPath("$.onboardingStep").value("ID_CARD_CONFIRMATION"));
	}

	@Test
	void rejectsUnknownIdCardType() throws Exception {
		mockMvc.perform(multipart("/api/onboarding/certificate/id-card/scan")
				.file(jpegImage())
				.param("issuanceId", ISSUANCE_ID)
				.param("idCardType", "PASSPORT"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsUnprocessableContentWhenOcrFails() throws Exception {
		when(idCardScanService.scan(anyString(), any(), any()))
			.thenThrow(new IdCardRecognitionFailedException());

		mockMvc.perform(multipart("/api/onboarding/certificate/id-card/scan")
				.file(jpegImage())
				.param("issuanceId", ISSUANCE_ID)
				.param("idCardType", "RESIDENT_CARD"))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.code").value("ID_CARD_RECOGNITION_FAILED"));
	}

	private MockMultipartFile jpegImage() {
		return new MockMultipartFile(
			"image",
			"id-card.jpg",
			"image/jpeg",
			"prototype-image".getBytes()
		);
	}
}
