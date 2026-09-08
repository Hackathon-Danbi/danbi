package com.danbi.domain.onboarding.repository;

import com.danbi.domain.onboarding.entity.IdCardScan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IdCardScanRepository extends JpaRepository<IdCardScan, String> {

	long countByIssuanceId(String issuanceId);
}
