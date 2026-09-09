package com.danbi.domain.transaction.dto;

import java.util.List;

/** 미확인 거래를 큰 글씨 화면과 음성 안내에서 함께 쓰는 요약 응답. */
public record UnreadVoiceSummaryResponse(
	long unreadCount,
	List<AccountSummary> accounts,
	String summaryText,
	String audioUrl
) {

	public record AccountSummary(Long accountId, String accountName, long unreadCount) {
	}
}
