package com.danbi.domain.transfer.dto;

import com.danbi.domain.transfer.entity.Transfer;
import com.danbi.domain.transfer.entity.TransferMethod;
import com.danbi.domain.transfer.entity.TransferStatus;
import java.time.LocalDateTime;

public record TransferResponse(
	Long transferId,
	Long accountId,
	String recipientBankCode,
	String recipientAccountNumber,
	String recipientName,
	long amount,
	TransferMethod transferMethod,
	TransferStatus status,
	boolean recipientIsNew,
	boolean risky,
	LocalDateTime requestedAt,
	LocalDateTime completedAt,
	/** 실행 직후에만 채워진다. 단건 조회(GET /api/transfer/{id})에서는 null. */
	Long transactionId,
	/** 실행 직후 출금 계좌 잔액. 단건 조회에서는 null. */
	Long balanceAfter
) {

	public static TransferResponse of(Transfer t, Long transactionId, long balanceAfter) {
		return build(t, transactionId, balanceAfter);
	}

	public static TransferResponse from(Transfer t) {
		return build(t, null, null);
	}

	private static TransferResponse build(Transfer t, Long transactionId, Long balanceAfter) {
		return new TransferResponse(
			t.getTransferId(),
			t.getAccountId(),
			t.getRecipientBankCode(),
			t.getRecipientAccountNumber(),
			t.getRecipientName(),
			t.getAmount(),
			t.getTransferMethod(),
			t.getStatus(),
			t.isRecipientIsNew(),
			t.isRisky(),
			t.getRequestedAt(),
			t.getCompletedAt(),
			transactionId,
			balanceAfter
		);
	}
}
