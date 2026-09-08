package com.danbi.transfer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 예금주 조회 요청. 계좌번호를 URL 에 남기지 않도록 POST 바디로 받는다. */
public record AccountHolderRequest(
	@NotBlank @Size(max = 10) String bankCode,
	@NotBlank @Size(max = 30) String accountNumber
) {
}
