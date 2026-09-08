package com.danbi.domain.onboarding.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BcryptSimplePasswordEncoder implements SimplePasswordEncoder {

	private final BCryptPasswordEncoder delegate = new BCryptPasswordEncoder();

	@Override
	public String encode(String rawPassword) {
		return delegate.encode(rawPassword);
	}

	@Override
	public boolean matches(String rawPassword, String encodedPassword) {
		return delegate.matches(rawPassword, encodedPassword);
	}
}
