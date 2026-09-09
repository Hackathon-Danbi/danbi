package com.danbi.domain.onboarding.repository;

import com.danbi.domain.onboarding.entity.OneWonVerification;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OneWonVerificationRepository
	extends JpaRepository<OneWonVerification, String> {

	Optional<OneWonVerification> findByVerificationId(String verificationId);
}
