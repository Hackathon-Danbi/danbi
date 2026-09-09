package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.SaveAccountVerificationTargetRequest;
import com.danbi.domain.onboarding.dto.SaveAccountVerificationTargetResponse;
import com.danbi.domain.onboarding.dto.VerifyAccountPasswordRequest;
import com.danbi.domain.onboarding.dto.VerifyAccountPasswordResponse;
import com.danbi.domain.onboarding.service.AccountPasswordVerificationService;
import com.danbi.domain.onboarding.service.AccountVerificationTargetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding/certificate/accounts")
@RequiredArgsConstructor
public class AccountVerificationTargetController {

	private final AccountVerificationTargetService accountVerificationTargetService;
	private final AccountPasswordVerificationService accountPasswordVerificationService;

	@PostMapping
	public SaveAccountVerificationTargetResponse save(
		@Valid @RequestBody SaveAccountVerificationTargetRequest request
	) {
		return accountVerificationTargetService.save(request);
	}

	@PostMapping("/{accountVerificationTargetId}/password/verify")
	public VerifyAccountPasswordResponse verifyPassword(
		@PathVariable String accountVerificationTargetId,
		@Valid @RequestBody VerifyAccountPasswordRequest request
	) {
		return accountPasswordVerificationService.verify(
			accountVerificationTargetId,
			request
		);
	}
}
