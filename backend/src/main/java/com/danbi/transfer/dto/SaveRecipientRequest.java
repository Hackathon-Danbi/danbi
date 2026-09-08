package com.danbi.transfer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SaveRecipientRequest(
	@NotNull Long userId,
	@NotBlank @Size(max = 10) String recipientBankCode,
	@NotBlank @Size(max = 30) String recipientAccountNumber,
	@NotBlank @Size(max = 50) String recipientName,
	@Size(max = 50) String nickname
) {
}
