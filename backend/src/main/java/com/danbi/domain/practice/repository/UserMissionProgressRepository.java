package com.danbi.domain.practice.repository;

import com.danbi.domain.practice.entity.UserMissionProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserMissionProgressRepository extends JpaRepository<UserMissionProgress, Long> {

	Optional<UserMissionProgress> findByUserIdAndMissionId(Long userId, Long missionId);

	List<UserMissionProgress> findByUserIdAndCompletedTrue(Long userId);
}
