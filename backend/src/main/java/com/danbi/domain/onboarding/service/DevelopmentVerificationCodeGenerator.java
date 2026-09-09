package com.danbi.domain.onboarding.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
	prefix = "danbi.onboarding",
	name = "random-phone-code",
	havingValue = "false",
	matchIfMissing = true
)
public class DevelopmentVerificationCodeGenerator implements VerificationCodeGenerator {

	private static final String FIXED_VERIFICATION_CODE = "381529";

	@Override
	public String generate() {
		return FIXED_VERIFICATION_CODE;
	}
}
