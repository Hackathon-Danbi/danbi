package com.danbi.domain.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.VerifyFaceResponse;
import com.danbi.domain.onboarding.entity.FaceCaptureStage;
import com.danbi.domain.onboarding.exception.FaceQualityCheckFailedException;
import com.danbi.domain.onboarding.exception.FaceVerificationConflictException;
import com.danbi.domain.onboarding.exception.OnboardingExceptionHandler;
import com.danbi.domain.onboarding.service.FaceVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class FaceVerificationControllerTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";
	private static final String SCAN_ID = "scan_0123456789abcdef0123456789abcdef";

	private MockMvc mockMvc;
	private FaceVerificationService faceVerificationService;

	@BeforeEach
	void setUp() {
		faceVerificationService = mock(FaceVerificationService.class);
		FaceVerificationController controller = new FaceVerificationController(
			faceVerificationService
		);
		mockMvc = MockMvcBuilders.standaloneSetup(controller)
			.setControllerAdvice(new OnboardingExceptionHandler())
			.build();
	}

	@Test
	void acceptsFaceImageAndReturnsNextStage() throws Exception {
		when(faceVerificationService.verify(anyString(), anyString(), any(), any()))
			.thenReturn(new VerifyFaceResponse(
				ISSUANCE_ID,
				FaceCaptureStage.FRONT_INITIAL,
				FaceCaptureStage.RIGHT,
				null,
				0,
				OnboardingStep.FACE_VERIFICATION
			));

		mockMvc.perform(multipart("/api/onboarding/certificate/face/verify")
				.file(jpegImage())
				.param("issuanceId", ISSUANCE_ID)
				.param("scanId", SCAN_ID)
				.param("captureStage", "FRONT_INITIAL"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.issuanceId").value(ISSUANCE_ID))
			.andExpect(jsonPath("$.completedStage").value("FRONT_INITIAL"))
			.andExpect(jsonPath("$.nextStage").value("RIGHT"))
			.andExpect(jsonPath("$.verified").doesNotExist())
			.andExpect(jsonPath("$.comparisonFailureCount").value(0))
			.andExpect(jsonPath("$.onboardingStep").value("FACE_VERIFICATION"));
	}

	@Test
	void rejectsUnknownCaptureStage() throws Exception {
		mockMvc.perform(multipart("/api/onboarding/certificate/face/verify")
				.file(jpegImage())
				.param("issuanceId", ISSUANCE_ID)
				.param("scanId", SCAN_ID)
				.param("captureStage", "FRONT"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void returnsConflictForWrongCaptureOrder() throws Exception {
		when(faceVerificationService.verify(anyString(), anyString(), any(), any()))
			.thenThrow(new FaceVerificationConflictException("잘못된 촬영 순서입니다."));

		mockMvc.perform(multipart("/api/onboarding/certificate/face/verify")
				.file(jpegImage())
				.param("issuanceId", ISSUANCE_ID)
				.param("scanId", SCAN_ID)
				.param("captureStage", "RIGHT"))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("FACE_VERIFICATION_CONFLICT"));
	}

	@Test
	void returnsUnprocessableContentWhenQualityCheckFails() throws Exception {
		when(faceVerificationService.verify(anyString(), anyString(), any(), any()))
			.thenThrow(new FaceQualityCheckFailedException());

		mockMvc.perform(multipart("/api/onboarding/certificate/face/verify")
				.file(jpegImage())
				.param("issuanceId", ISSUANCE_ID)
				.param("scanId", SCAN_ID)
				.param("captureStage", "FRONT_INITIAL"))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.code").value("FACE_QUALITY_CHECK_FAILED"));
	}

	private MockMultipartFile jpegImage() {
		return new MockMultipartFile(
			"faceImage",
			"face.jpg",
			"image/jpeg",
			"actual-camera-image".getBytes()
		);
	}
}
