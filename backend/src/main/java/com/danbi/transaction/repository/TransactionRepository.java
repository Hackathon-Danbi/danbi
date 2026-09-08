package com.danbi.transaction.repository;

import com.danbi.transaction.entity.ReviewStatus;
import com.danbi.transaction.entity.Transaction;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

	long countByAccountIdAndReviewStatus(Long accountId, ReviewStatus reviewStatus);

	List<Transaction> findByAccountIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
		Long accountId, LocalDateTime start, LocalDateTime end);
}
