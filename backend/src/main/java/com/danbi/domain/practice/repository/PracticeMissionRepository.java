package com.danbi.domain.practice.repository;

import com.danbi.domain.practice.entity.PracticeMission;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PracticeMissionRepository extends JpaRepository<PracticeMission, Long> {

	Optional<PracticeMission> findByCode(String code);

	List<PracticeMission> findAllByOrderByMissionIdAsc();
}
