package com.danbi.transfer.entity;

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
@Table(name = "transfers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Transfer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long transferId;

	@Column(nullable = false)
	private Long accountId;

	private Long savedRecipientId;

	@Column(nullable = false, length = 10)
	private String recipientBankCode;

	@Column(nullable = false, length = 30)
	private String recipientAccountNumber;

	@Column(nullable = false, length = 50)
	private String recipientName;

	@Column(nullable = false)
	private Long amount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TransferMethod transferMethod;

	@Column(nullable = false)
	@ColumnDefault("false")
	private boolean recipientIsNew;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@ColumnDefault("'PENDING'")
	@Builder.Default
	private TransferStatus status = TransferStatus.PENDING;

	@Column(nullable = false)
	private LocalDateTime requestedAt;

	private LocalDateTime completedAt;

	@Column(nullable = false)
	@ColumnDefault("false")
	private boolean isInCall;

	@Column(nullable = false)
	@ColumnDefault("false")
	private boolean isRisky;

	public void complete() {
		this.status = TransferStatus.COMPLETED;
		this.completedAt = LocalDateTime.now();
	}

	public void fail() {
		this.status = TransferStatus.FAILED;
	}
}
