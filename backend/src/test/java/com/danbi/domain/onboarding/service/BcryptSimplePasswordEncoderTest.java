package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BcryptSimplePasswordEncoderTest {

	private final BcryptSimplePasswordEncoder encoder = new BcryptSimplePasswordEncoder();

	@Test
	void hashesAndMatchesPassword() {
		String encoded = encoder.encode("593817");

		assertThat(encoded).isNotEqualTo("593817");
		assertThat(encoder.matches("593817", encoded)).isTrue();
		assertThat(encoder.matches("593818", encoded)).isFalse();
	}
}
