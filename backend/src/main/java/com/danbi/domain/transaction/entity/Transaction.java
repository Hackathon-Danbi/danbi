package com.danbi.domain.transaction.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "transactions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Transaction {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long transactionId;

	@Column(nullable = false)
	private Long accountId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TransactionType transactionType;

	@Column(nullable = false, length = 100)
	private String description;

	@Column(nullable = false)
	private Long amount;

	@Column(nullable = false)
	private LocalDateTime occurredAt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@ColumnDefault("'PENDING'")
	@Builder.Default
	private ReviewStatus reviewStatus = ReviewStatus.PENDING;

	private LocalDateTime reviewedAt;

	/** 거래내역 확인 처리. KNOWN 또는 UNKNOWN 만 허용. */
	public void review(ReviewStatus status) {
		if (status == null || status == ReviewStatus.PENDING) {
			throw new IllegalArgumentException("확인 상태는 KNOWN 또는 UNKNOWN 이어야 합니다.");
		}
		this.reviewStatus = status;
		this.reviewedAt = LocalDateTime.now();
	}
}
