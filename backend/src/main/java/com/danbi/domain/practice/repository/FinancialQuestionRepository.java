package com.danbi.domain.practice.repository;

import com.danbi.domain.practice.entity.FinancialQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialQuestionRepository extends JpaRepository<FinancialQuestion, Long> {

	List<FinancialQuestion> findAllByOrderByQuestionIdAsc();
}
