package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameResponse;
import com.danbi.domain.onboarding.service.OnboardingSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding/name")
@RequiredArgsConstructor
public class OnboardingNameController {

	private final OnboardingSessionService onboardingSessionService;

	@PostMapping
	public SaveOnboardingNameResponse saveName(@Valid @RequestBody SaveOnboardingNameRequest request) {
		return onboardingSessionService.saveName(request);
	}
}
