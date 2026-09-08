package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.entity.FaceCaptureStage;
import com.danbi.domain.onboarding.entity.IdCardScan;
import org.springframework.web.multipart.MultipartFile;

public interface FaceVerificationClient {

	boolean passesQuality(FaceCaptureStage captureStage, MultipartFile faceImage);

	boolean matchesIdCard(IdCardScan idCardScan, MultipartFile finalFrontImage);
}
