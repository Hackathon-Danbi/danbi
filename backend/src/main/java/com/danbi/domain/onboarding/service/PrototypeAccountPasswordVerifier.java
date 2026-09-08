package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PrototypeAccountPasswordVerifier implements AccountPasswordVerifier {

	private final byte[] prototypePassword;

	public PrototypeAccountPasswordVerifier(
		@Value("${danbi.onboarding.prototype-account-password:1234}") String prototypePassword
	) {
		this.prototypePassword = prototypePassword.getBytes(StandardCharsets.UTF_8);
	}

	@Override
	public boolean matches(AccountVerificationTarget target, String rawPassword) {
		return MessageDigest.isEqual(
			prototypePassword,
			rawPassword.getBytes(StandardCharsets.UTF_8)
		);
	}
}
