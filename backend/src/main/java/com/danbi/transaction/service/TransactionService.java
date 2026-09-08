package com.danbi.transaction.service;

import com.danbi.transaction.dto.MonthlyTransactionsResponse;
import com.danbi.transaction.dto.TransactionResponse;
import com.danbi.transaction.dto.UnreviewedCountResponse;
import com.danbi.transaction.entity.ReviewStatus;
import com.danbi.transaction.entity.Transaction;
import com.danbi.transaction.repository.TransactionRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransactionService {

	private final TransactionRepository transactionRepository;

	/** 미확인(PENDING) 거래 건수. 거래내역 배너 노출 판단에 사용. */
	public UnreviewedCountResponse getUnreviewedCount(Long accountId) {
		long count = transactionRepository.countByAccountIdAndReviewStatus(accountId, ReviewStatus.PENDING);
		return new UnreviewedCountResponse(accountId, count);
	}

	/** 특정 계좌의 월별 거래내역(최신순). */
	public MonthlyTransactionsResponse getMonthlyTransactions(Long accountId, int year, int month) {
		if (month < 1 || month > 12) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "month 는 1~12 여야 합니다.");
		}
		LocalDateTime start = LocalDate.of(year, month, 1).atStartOfDay();
		LocalDateTime end = start.plusMonths(1);

		List<TransactionResponse> transactions = transactionRepository
			.findByAccountIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(accountId, start, end)
			.stream()
			.map(TransactionResponse::from)
			.toList();

		return new MonthlyTransactionsResponse(accountId, year, month, transactions.size(), transactions);
	}

	/** 거래내역 단건 확인 처리(KNOWN/UNKNOWN). */
	@Transactional
	public TransactionResponse review(Long transactionId, ReviewStatus reviewStatus) {
		Transaction transaction = transactionRepository.findById(transactionId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "거래를 찾을 수 없습니다."));
		try {
			transaction.review(reviewStatus);
		} catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
		}
		return TransactionResponse.from(transaction);
	}
}
