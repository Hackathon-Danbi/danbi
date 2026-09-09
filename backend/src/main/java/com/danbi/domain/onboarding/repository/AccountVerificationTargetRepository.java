package com.danbi.domain.onboarding.repository;

import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountVerificationTargetRepository
	extends JpaRepository<AccountVerificationTarget, String> {

	Optional<AccountVerificationTarget> findByIssuanceId(String issuanceId);
}
