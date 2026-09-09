package com.danbi.domain.savings.controller;

import com.danbi.domain.savings.dto.SavingsResponse;
import com.danbi.domain.savings.service.SavingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/savings", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class SavingsController {
    // TODO: 인증 연동 시 로그인한 사용자의 ID로 교체한다.
    private static final Long USER_ID = 1L;

    private final SavingsService service;

    @GetMapping
    public ResponseEntity<SavingsResponse.AccountList> getSavings() {
        return ResponseEntity.ok(service.getSavings(USER_ID));
    }

    @GetMapping("/deposits/{accountId}")
    public ResponseEntity<SavingsResponse.Deposit> getDeposit(@PathVariable Long accountId) {
        return ResponseEntity.ok(service.getDeposit(USER_ID, accountId));
    }

    @GetMapping("/installments/{accountId}")
    public ResponseEntity<SavingsResponse.Installment> getInstallment(@PathVariable Long accountId) {
        return ResponseEntity.ok(service.getInstallment(USER_ID, accountId));
    }

}
