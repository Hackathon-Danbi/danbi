package com.danbi.domain.onboarding.controller;

import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.repository.InMemoryOnboardingSessionRepository;
import com.danbi.domain.onboarding.service.OnboardingSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class OnboardingSessionControllerTest {

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		InMemoryOnboardingSessionRepository repository = new InMemoryOnboardingSessionRepository();
		OnboardingSessionService service = new OnboardingSessionService(repository);
		OnboardingSessionController controller = new OnboardingSessionController(service);
		mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
	}

	@Test
	void createsOnboardingSession() throws Exception {
		mockMvc.perform(post("/api/onboarding/sessions"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.onboardingSessionId", matchesPattern("ob_[0-9a-f]{32}")))
			.andExpect(jsonPath("$.onboardingStep").value("NAME_INPUT"))
			.andExpect(jsonPath("$.estimatedMinutes").value(15));
	}
}
