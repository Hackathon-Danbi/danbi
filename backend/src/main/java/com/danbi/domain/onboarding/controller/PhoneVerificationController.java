package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.RequestPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationResponse;
import com.danbi.domain.onboarding.service.PhoneVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding/phone/verify")
@RequiredArgsConstructor
public class PhoneVerificationController {

	private final PhoneVerificationService phoneVerificationService;

	@PostMapping("/request")
	@ResponseStatus(HttpStatus.CREATED)
	public RequestPhoneVerificationResponse requestVerification(
		@Valid @RequestBody RequestPhoneVerificationRequest request
	) {
		return phoneVerificationService.requestVerification(request);
	}
}
