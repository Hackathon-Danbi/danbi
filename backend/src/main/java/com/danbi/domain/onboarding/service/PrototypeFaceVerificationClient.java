package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.entity.FaceCaptureStage;
import com.danbi.domain.onboarding.entity.IdCardScan;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class PrototypeFaceVerificationClient implements FaceVerificationClient {

	@Override
	public boolean passesQuality(FaceCaptureStage captureStage, MultipartFile faceImage) {
		return true;
	}

	@Override
	public boolean matchesIdCard(IdCardScan idCardScan, MultipartFile finalFrontImage) {
		return true;
	}
}
