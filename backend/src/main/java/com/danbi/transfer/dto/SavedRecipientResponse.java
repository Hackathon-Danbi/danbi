package com.danbi.transfer.dto;

import com.danbi.transfer.entity.SavedRecipient;
import com.danbi.transfer.entity.Transfer;
import java.time.LocalDateTime;

/** 저장 수취인 + 최근 송금계좌 통합 목록의 한 항목. */
public record SavedRecipientResponse(
	Long savedRecipientId,
	String recipientBankCode,
	String recipientAccountNumber,
	String recipientName,
	String nickname,
	LocalDateTime lastTransferredAt,
	String source
) {

	public static SavedRecipientResponse fromSaved(SavedRecipient s) {
		return new SavedRecipientResponse(
			s.getSavedRecipientId(),
			s.getRecipientBankCode(),
			s.getRecipientAccountNumber(),
			s.getRecipientName(),
			s.getNickname(),
			null,
			"SAVED"
		);
	}

	public static SavedRecipientResponse fromRecentTransfer(Transfer t) {
		return new SavedRecipientResponse(
			null,
			t.getRecipientBankCode(),
			t.getRecipientAccountNumber(),
			t.getRecipientName(),
			null,
			t.getCompletedAt(),
			"RECENT"
		);
	}
}
