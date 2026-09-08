package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.SaveAccountVerificationTargetRequest;
import com.danbi.domain.onboarding.dto.SaveAccountVerificationTargetResponse;
import com.danbi.domain.onboarding.service.AccountVerificationTargetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding/certificate/accounts")
@RequiredArgsConstructor
public class AccountVerificationTargetController {

	private final AccountVerificationTargetService accountVerificationTargetService;

	@PostMapping
	public SaveAccountVerificationTargetResponse save(
		@Valid @RequestBody SaveAccountVerificationTargetRequest request
	) {
		return accountVerificationTargetService.save(request);
	}
}
