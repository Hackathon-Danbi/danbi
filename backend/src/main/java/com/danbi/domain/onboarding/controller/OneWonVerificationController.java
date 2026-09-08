package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.RequestOneWonVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestOneWonVerificationResponse;
import com.danbi.domain.onboarding.service.OneWonVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding/certificate/accounts/{accountVerificationTargetId}/one-won")
@RequiredArgsConstructor
public class OneWonVerificationController {

	private final OneWonVerificationService oneWonVerificationService;

	@PostMapping("/request")
	public RequestOneWonVerificationResponse request(
		@PathVariable String accountVerificationTargetId,
		@Valid @RequestBody RequestOneWonVerificationRequest request
	) {
		return oneWonVerificationService.request(
			accountVerificationTargetId,
			request
		);
	}
}
