package com.danbi.domain.onboarding.repository;

import com.danbi.domain.onboarding.entity.FaceVerification;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaceVerificationRepository extends JpaRepository<FaceVerification, String> {

	Optional<FaceVerification> findByIssuanceId(String issuanceId);
}
