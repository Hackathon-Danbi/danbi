package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.VerifyFaceResponse;
import com.danbi.domain.onboarding.entity.FaceCaptureStage;
import com.danbi.domain.onboarding.service.FaceVerificationService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/onboarding/certificate/face")
@RequiredArgsConstructor
@Validated
public class FaceVerificationController {

	private final FaceVerificationService faceVerificationService;

	@PostMapping(value = "/verify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public VerifyFaceResponse verify(
		@RequestParam @NotBlank String issuanceId,
		@RequestParam @NotBlank String scanId,
		@RequestParam FaceCaptureStage captureStage,
		@RequestPart("faceImage") MultipartFile faceImage
	) {
		return faceVerificationService.verify(issuanceId, scanId, captureStage, faceImage);
	}
}
