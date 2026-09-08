package com.danbi.domain.onboarding.repository;

import com.danbi.domain.onboarding.entity.CertificateIssuance;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificateIssuanceRepository extends JpaRepository<CertificateIssuance, String> {

	Optional<CertificateIssuance> findByOnboardingSessionId(String onboardingSessionId);
}
