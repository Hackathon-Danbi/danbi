package com.danbi.domain.practice.repository;

import com.danbi.domain.practice.entity.DailyActivity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyActivityRepository extends JpaRepository<DailyActivity, Long> {

	Optional<DailyActivity> findByUserIdAndActivityDate(Long userId, LocalDate activityDate);

	List<DailyActivity> findByUserIdAndActivityDateBetween(Long userId, LocalDate start, LocalDate end);
}
