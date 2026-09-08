package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.ScanIdCardResponse;
import com.danbi.domain.onboarding.entity.CertificateIssuance;
import com.danbi.domain.onboarding.entity.IdCardScan;
import com.danbi.domain.onboarding.entity.IdCardType;
import com.danbi.domain.onboarding.entity.OnboardingSession;
import com.danbi.domain.onboarding.exception.CertificateIssuanceNotFoundException;
import com.danbi.domain.onboarding.exception.IdCardNameMismatchException;
import com.danbi.domain.onboarding.exception.IdCardRecognitionFailedException;
import com.danbi.domain.onboarding.exception.InvalidIdCardImageException;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.repository.CertificateIssuanceRepository;
import com.danbi.domain.onboarding.repository.IdCardScanRepository;
import com.danbi.domain.onboarding.repository.OnboardingSessionRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IdCardScanService {

	private static final String SCAN_ID_PREFIX = "scan_";
	private static final Set<String> SUPPORTED_CONTENT_TYPES = Set.of(
		MediaType.IMAGE_JPEG_VALUE,
		MediaType.IMAGE_PNG_VALUE
	);

	private final CertificateIssuanceRepository certificateIssuanceRepository;
	private final OnboardingSessionRepository onboardingSessionRepository;
	private final IdCardScanRepository idCardScanRepository;
	private final IdCardOcrClient idCardOcrClient;
	private final Clock clock;

	@Transactional
	public ScanIdCardResponse scan(
		String issuanceId,
		IdCardType idCardType,
		MultipartFile image
	) {
		validateImage(image);
		CertificateIssuance issuance = certificateIssuanceRepository.findById(issuanceId)
			.orElseThrow(() -> new CertificateIssuanceNotFoundException(issuanceId));
		OnboardingSession onboardingSession = onboardingSessionRepository
			.findById(issuance.getOnboardingSessionId())
			.orElseThrow(() -> new OnboardingSessionNotFoundException(
				issuance.getOnboardingSessionId()
			));

		IdCardOcrResult ocrResult = idCardOcrClient.recognize(idCardType, image);
		validateOcrResult(ocrResult);
		validateName(onboardingSession.getName(), ocrResult.recognizedName());

		IdCardScan scan = IdCardScan.recognized(
			generateScanId(),
			issuance.getIssuanceId(),
			idCardType,
			ocrResult.recognizedName().strip(),
			ocrResult.maskedIdNumber(),
			ocrResult.issueDate(),
			Instant.now(clock)
		);
		idCardScanRepository.save(scan);

		return new ScanIdCardResponse(
			scan.getIssuanceId(),
			scan.getScanId(),
			scan.getIdCardType(),
			scan.getRecognizedName(),
			scan.getMaskedIdNumber(),
			scan.getIssueDate(),
			OnboardingStep.ID_CARD_CONFIRMATION
		);
	}

	private void validateImage(MultipartFile image) {
		if (image == null || image.isEmpty()) {
			throw new InvalidIdCardImageException("신분증 이미지가 비어 있습니다.");
		}
		if (!SUPPORTED_CONTENT_TYPES.contains(image.getContentType())) {
			throw new InvalidIdCardImageException("JPG 또는 PNG 이미지만 업로드할 수 있습니다.");
		}
	}

	private void validateOcrResult(IdCardOcrResult result) {
		if (result == null
			|| result.recognizedName() == null
			|| result.recognizedName().isBlank()
			|| result.maskedIdNumber() == null
			|| result.maskedIdNumber().isBlank()
			|| result.issueDate() == null) {
			throw new IdCardRecognitionFailedException();
		}
	}

	private void validateName(String onboardingName, String recognizedName) {
		if (!normalizeName(onboardingName).equals(normalizeName(recognizedName))) {
			throw new IdCardNameMismatchException();
		}
	}

	private String normalizeName(String name) {
		if (name == null) {
			return "";
		}
		return name.codePoints()
			.filter(codePoint -> !Character.isWhitespace(codePoint))
			.collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
			.toString();
	}

	private String generateScanId() {
		return SCAN_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
	}
}
