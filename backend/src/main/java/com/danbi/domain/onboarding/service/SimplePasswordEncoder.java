package com.danbi.domain.onboarding.service;

public interface SimplePasswordEncoder {

	String encode(String rawPassword);

	boolean matches(String rawPassword, String encodedPassword);
}
