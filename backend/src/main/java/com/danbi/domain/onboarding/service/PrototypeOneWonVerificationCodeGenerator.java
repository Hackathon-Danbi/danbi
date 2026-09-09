package com.danbi.domain.onboarding.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PrototypeOneWonVerificationCodeGenerator
	implements OneWonVerificationCodeGenerator {

	private final String verificationCode;

	public PrototypeOneWonVerificationCodeGenerator(
		@Value("${danbi.onboarding.prototype-one-won-code:4821}") String verificationCode
	) {
		this.verificationCode = verificationCode;
	}

	@Override
	public String generate() {
		return verificationCode;
	}
}
