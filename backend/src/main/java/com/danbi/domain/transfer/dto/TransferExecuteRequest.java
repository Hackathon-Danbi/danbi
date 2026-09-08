package com.danbi.domain.transfer.dto;

import com.danbi.domain.transfer.entity.TransferMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record TransferExecuteRequest(
	@NotNull Long accountId,
	Long savedRecipientId,
	@NotBlank @Size(max = 10) String recipientBankCode,
	@NotBlank @Size(max = 30) String recipientAccountNumber,
	@NotBlank @Size(max = 50) String recipientName,
	@NotNull @Positive Long amount,
	@NotNull TransferMethod transferMethod,
	@NotBlank String accountPassword,
	Boolean riskAcknowledged,
	Boolean isInCall,
	Boolean requestedByCaller,
	Boolean phishingKeywordDetected,
	@NotBlank @Size(max = 36) String flowSessionId
) {

	/** 선택 플래그는 생략 시 false 로 처리한다. */
	public TransferExecuteRequest {
		riskAcknowledged = Boolean.TRUE.equals(riskAcknowledged);
		isInCall = Boolean.TRUE.equals(isInCall);
		requestedByCaller = Boolean.TRUE.equals(requestedByCaller);
		phishingKeywordDetected = Boolean.TRUE.equals(phishingKeywordDetected);
	}
}
