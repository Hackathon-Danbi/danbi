package com.danbi.transaction.controller;

import com.danbi.transaction.dto.MonthlyTransactionsResponse;
import com.danbi.transaction.dto.ReviewRequest;
import com.danbi.transaction.dto.TransactionResponse;
import com.danbi.transaction.dto.UnreviewedCountResponse;
import com.danbi.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

	private final TransactionService transactionService;

	/** 월별 거래내역 조회. 예) GET /api/transactions?accountId=1&year=2026&month=9 */
	@GetMapping
	public MonthlyTransactionsResponse getMonthly(
		@RequestParam Long accountId,
		@RequestParam int year,
		@RequestParam int month) {
		return transactionService.getMonthlyTransactions(accountId, year, month);
	}

	/** 미확인 거래 건수. 예) GET /api/transactions/unreviewed-count?accountId=1 */
	@GetMapping("/unreviewed-count")
	public UnreviewedCountResponse getUnreviewedCount(@RequestParam Long accountId) {
		return transactionService.getUnreviewedCount(accountId);
	}

	/** 거래내역 확인 처리. PATCH /api/transactions/{transactionId}/review  body: { "reviewStatus": "KNOWN" } */
	@PatchMapping("/{transactionId}/review")
	public TransactionResponse review(
		@PathVariable Long transactionId,
		@RequestBody @Valid ReviewRequest request) {
		return transactionService.review(transactionId, request.reviewStatus());
	}
}
