package com.danbi.domain.practice.repository;

import com.danbi.domain.practice.entity.TransferDifficulty;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransferDifficultyRepository extends JpaRepository<TransferDifficulty, Long> {

	List<TransferDifficulty> findByUserIdOrderByOccurredAtDesc(Long userId);

	Optional<TransferDifficulty> findByDifficultyIdAndUserId(Long difficultyId, Long userId);
}
