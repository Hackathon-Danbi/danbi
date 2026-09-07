package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.CreateOnboardingSessionResponse;
import com.danbi.domain.onboarding.service.OnboardingSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding/sessions")
public class OnboardingSessionController {

	private final OnboardingSessionService onboardingSessionService;

	public OnboardingSessionController(OnboardingSessionService onboardingSessionService) {
		this.onboardingSessionService = onboardingSessionService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public CreateOnboardingSessionResponse createSession() {
		return onboardingSessionService.createSession();
	}
}
