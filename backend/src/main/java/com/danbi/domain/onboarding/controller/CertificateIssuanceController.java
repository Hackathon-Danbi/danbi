package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.StartCertificateIssuanceRequest;
import com.danbi.domain.onboarding.dto.StartCertificateIssuanceResponse;
import com.danbi.domain.onboarding.service.CertificateIssuanceService;
import com.danbi.domain.onboarding.service.CertificateIssuanceStartResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding/certificate/issuance")
@RequiredArgsConstructor
public class CertificateIssuanceController {

	private final CertificateIssuanceService certificateIssuanceService;

	@PostMapping
	public ResponseEntity<StartCertificateIssuanceResponse> start(
		@Valid @RequestBody StartCertificateIssuanceRequest request
	) {
		CertificateIssuanceStartResult result = certificateIssuanceService.start(request);
		HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
		return ResponseEntity.status(status).body(result.response());
	}
}
