package com.danbi.domain.transaction.repository;

import com.danbi.domain.transaction.entity.ReviewStatus;
import com.danbi.domain.transaction.entity.Transaction;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    interface PendingCount {
        Long getAccountId();
        long getCount();
        LocalDateTime getOldest();
    }

    @Query("""
        select t.accountId as accountId, count(t) as count, min(t.occurredAt) as oldest
        from Transaction t, Account a
        where t.accountId = a.accountId and a.userId = :userId and t.reviewStatus = :status
        group by t.accountId
        """)
    List<PendingCount> countByOwner(@Param("userId") Long userId, @Param("status") ReviewStatus status);

    List<Transaction> findByAccountIdAndReviewStatusOrderByOccurredAtDescTransactionIdDesc(
        Long accountId, ReviewStatus status);

	long countByAccountIdAndReviewStatus(Long accountId, ReviewStatus reviewStatus);

	List<Transaction> findByAccountIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
		Long accountId, LocalDateTime start, LocalDateTime end);
}
