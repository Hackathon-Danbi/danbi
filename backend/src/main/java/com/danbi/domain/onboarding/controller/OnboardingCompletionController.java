package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.GetOnboardingCompletionResponse;
import com.danbi.domain.onboarding.service.OnboardingCompletionService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding/complete")
@RequiredArgsConstructor
@Validated
public class OnboardingCompletionController {

	private final OnboardingCompletionService onboardingCompletionService;

	@GetMapping
	public GetOnboardingCompletionResponse get(
		@RequestParam @NotBlank String onboardingSessionId
	) {
		return onboardingCompletionService.get(onboardingSessionId);
	}
}
