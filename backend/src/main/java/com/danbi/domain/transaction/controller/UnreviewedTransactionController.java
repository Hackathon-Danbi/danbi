package com.danbi.domain.transaction.controller;

import com.danbi.domain.transaction.dto.UnreviewedTransactionsResponse.*;
import com.danbi.domain.transaction.service.UnreviewedTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UnreviewedTransactionController {
    // TODO: 인증 연동 시 로그인한 사용자의 ID로 교체한다.
    private static final Long USER_ID = 1L;

    private final UnreviewedTransactionService service;

    @GetMapping("/unreviewed-transactions/summary")
    public Summary summary() {
        return service.summary(USER_ID);
    }

    @GetMapping("/accounts/unreviewed-transaction-counts")
    public AccountCounts counts() {
        return service.counts(USER_ID);
    }

    @GetMapping("/accounts/{accountId}/unreviewed-transactions")
    public AccountTransactions list(@PathVariable Long accountId) {
        return service.list(USER_ID, accountId);
    }

}
