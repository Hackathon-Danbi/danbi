package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.StartCertificateIssuanceResponse;

public record CertificateIssuanceStartResult(
	StartCertificateIssuanceResponse response,
	boolean created
) {
}
