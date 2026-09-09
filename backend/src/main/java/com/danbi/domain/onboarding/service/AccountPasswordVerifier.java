package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.entity.AccountVerificationTarget;

public interface AccountPasswordVerifier {

	boolean matches(AccountVerificationTarget target, String rawPassword);
}
