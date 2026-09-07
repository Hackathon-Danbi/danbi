package com.danbi.domain.onboarding.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevelopmentVerificationCodeGenerator implements VerificationCodeGenerator {

	private static final String FIXED_VERIFICATION_CODE = "381529";

	@Override
	public String generate() {
		return FIXED_VERIFICATION_CODE;
	}
}
