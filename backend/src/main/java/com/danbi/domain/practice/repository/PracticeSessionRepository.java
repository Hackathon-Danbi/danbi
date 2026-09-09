package com.danbi.domain.practice.repository;

import com.danbi.domain.practice.entity.PracticeSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PracticeSessionRepository extends JpaRepository<PracticeSession, String> {
}
