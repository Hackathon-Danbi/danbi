package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class VerificationCodeConfigurationTest {

	private final ApplicationContextRunner runner = new ApplicationContextRunner()
		.withUserConfiguration(
			DevelopmentVerificationCodeGenerator.class,
			RandomVerificationCodeGenerator.class,
			PrototypeOneWonVerificationCodeGenerator.class
		);

	@Test
	void defaultsToFixedCodesWithoutAnActiveProfile() {
		assertFixedCodes(runner);
	}

	@Test
	void changingProfileDoesNotChangeTheDemoCodes() {
		for (String profile : new String[] {"dev", "test", "prod"}) {
			assertFixedCodes(runner.withPropertyValues("spring.profiles.active=" + profile));
		}
	}

	@Test
	void explicitFalseKeepsFixedCodes() {
		assertFixedCodes(runner.withPropertyValues("danbi.onboarding.random-phone-code=false"));
	}

	@Test
	void randomPhoneCodesRequireExplicitOptIn() {
		runner.withPropertyValues("danbi.onboarding.random-phone-code=true").run(context -> {
			assertThat(context).hasSingleBean(VerificationCodeGenerator.class);
			VerificationCodeGenerator generator = context.getBean(VerificationCodeGenerator.class);
			assertThat(generator).isInstanceOf(RandomVerificationCodeGenerator.class);
			assertThat(generator.generate()).matches("[0-9]{6}");
		});
	}

	private void assertFixedCodes(ApplicationContextRunner contextRunner) {
		contextRunner.run(context -> {
			assertThat(context).hasSingleBean(VerificationCodeGenerator.class);
			VerificationCodeGenerator phone = context.getBean(VerificationCodeGenerator.class);
			OneWonVerificationCodeGenerator oneWon = context.getBean(OneWonVerificationCodeGenerator.class);
			for (int attempt = 0; attempt < 5; attempt++) {
				assertThat(phone.generate()).isEqualTo("381529");
				assertThat(oneWon.generate()).isEqualTo("4821");
			}
		});
	}
}
