package com.danbi.domain.onboarding.repository;

import com.danbi.domain.onboarding.entity.IdCardScan;
import com.danbi.domain.onboarding.entity.IdCardConfirmationStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IdCardScanRepository extends JpaRepository<IdCardScan, String> {

	long countByIssuanceId(String issuanceId);

	long countByIssuanceIdAndConfirmationStatus(
		String issuanceId,
		IdCardConfirmationStatus confirmationStatus
	);

	boolean existsByIssuanceIdAndConfirmationStatus(
		String issuanceId,
		IdCardConfirmationStatus confirmationStatus
	);

	Optional<IdCardScan> findByScanIdAndIssuanceId(String scanId, String issuanceId);
}
