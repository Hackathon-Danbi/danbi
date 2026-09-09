package com.danbi.domain.practice.dto;

import java.util.List;

/** FE {@code practiceApi.getAccounts} 는 {@code { accounts: [...] }} 래퍼를 기대한다. */
public record PracticeAccountsResponse(
	List<PracticeAccountResponse> accounts
) {
}
