package com.danbi.transaction;

import static org.assertj.core.api.Assertions.assertThat;

import com.danbi.transaction.entity.ReviewStatus;
import com.danbi.transaction.entity.Transaction;
import com.danbi.transaction.entity.TransactionType;
import com.danbi.transaction.repository.TransactionRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class TransactionRepositoryTest {

	@Autowired
	private TransactionRepository transactionRepository;

	private Transaction tx(Long accountId, TransactionType type, long amount, LocalDateTime occurredAt, ReviewStatus status) {
		return Transaction.builder()
			.accountId(accountId)
			.transactionType(type)
			.description("테스트")
			.amount(amount)
			.occurredAt(occurredAt)
			.reviewStatus(status)
			.build();
	}

	@Test
	void countsOnlyPendingForGivenAccount() {
		transactionRepository.save(tx(1L, TransactionType.WITHDRAWAL, 1000, LocalDateTime.now(), ReviewStatus.PENDING));
		transactionRepository.save(tx(1L, TransactionType.DEPOSIT, 2000, LocalDateTime.now(), ReviewStatus.PENDING));
		transactionRepository.save(tx(1L, TransactionType.DEPOSIT, 3000, LocalDateTime.now(), ReviewStatus.KNOWN));
		transactionRepository.save(tx(2L, TransactionType.WITHDRAWAL, 4000, LocalDateTime.now(), ReviewStatus.PENDING));

		long count = transactionRepository.countByAccountIdAndReviewStatus(1L, ReviewStatus.PENDING);

		assertThat(count).isEqualTo(2);
	}

	@Test
	void monthlyQueryFiltersByRangeAndSortsDesc() {
		transactionRepository.save(tx(1L, TransactionType.DEPOSIT, 100, LocalDateTime.of(2026, 8, 31, 23, 0), ReviewStatus.PENDING));
		transactionRepository.save(tx(1L, TransactionType.DEPOSIT, 200, LocalDateTime.of(2026, 9, 1, 0, 0), ReviewStatus.PENDING));
		transactionRepository.save(tx(1L, TransactionType.DEPOSIT, 300, LocalDateTime.of(2026, 9, 20, 12, 0), ReviewStatus.PENDING));
		transactionRepository.save(tx(1L, TransactionType.DEPOSIT, 400, LocalDateTime.of(2026, 10, 1, 0, 0), ReviewStatus.PENDING));

		LocalDateTime start = LocalDateTime.of(2026, 9, 1, 0, 0);
		LocalDateTime end = start.plusMonths(1);
		List<Transaction> result = transactionRepository
			.findByAccountIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(1L, start, end);

		assertThat(result).extracting(Transaction::getAmount).containsExactly(300L, 200L);
	}
}
