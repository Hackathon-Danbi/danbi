package com.danbi.domain.onboarding.controller;

import com.danbi.domain.onboarding.dto.SetSimplePasswordRequest;
import com.danbi.domain.onboarding.dto.SetSimplePasswordResponse;
import com.danbi.domain.onboarding.service.SimplePasswordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding/certificate/password")
@RequiredArgsConstructor
public class SimplePasswordController {

	private final SimplePasswordService simplePasswordService;

	@PostMapping
	public SetSimplePasswordResponse set(
		@Valid @RequestBody SetSimplePasswordRequest request
	) {
		return simplePasswordService.set(request);
	}
}
