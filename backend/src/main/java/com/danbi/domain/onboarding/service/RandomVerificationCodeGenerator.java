package com.danbi.domain.onboarding.service;

import java.security.SecureRandom;
import java.util.Locale;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
	prefix = "danbi.onboarding",
	name = "random-phone-code",
	havingValue = "true"
)
public class RandomVerificationCodeGenerator implements VerificationCodeGenerator {

	private static final int VERIFICATION_CODE_BOUND = 1_000_000;

	private final SecureRandom secureRandom = new SecureRandom();

	@Override
	public String generate() {
		return String.format(Locale.ROOT, "%06d", secureRandom.nextInt(VERIFICATION_CODE_BOUND));
	}
}
