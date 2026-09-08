package com.danbi.domain.transaction.dto;

import com.danbi.domain.transaction.entity.Transaction;
import com.danbi.domain.transaction.entity.ReviewStatus;
import com.danbi.domain.transaction.entity.TransactionType;
import java.time.LocalDateTime;

public record TransactionResponse(
	Long transactionId,
	Long accountId,
	TransactionType transactionType,
	String description,
	Long amount,
	LocalDateTime occurredAt,
	ReviewStatus reviewStatus,
	LocalDateTime reviewedAt
) {

	public static TransactionResponse from(Transaction tx) {
		return new TransactionResponse(
			tx.getTransactionId(),
			tx.getAccountId(),
			tx.getTransactionType(),
			tx.getDescription(),
			tx.getAmount(),
			tx.getOccurredAt(),
			tx.getReviewStatus(),
			tx.getReviewedAt()
		);
	}
}
