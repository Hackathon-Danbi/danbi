package com.danbi.domain.savings.controller;

import com.danbi.domain.savings.dto.SavingsResponse;
import com.danbi.domain.savings.service.SavingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.security.Principal;

@RestController
@RequestMapping(value = "/api/savings", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class SavingsController {
    private final SavingsService service;

    @GetMapping
    public ResponseEntity<SavingsResponse.AccountList> getSavings(Principal principal) {
        return ResponseEntity.ok(service.getSavings(currentUserId(principal)));
    }

    @GetMapping("/deposits/{accountId}")
    public ResponseEntity<SavingsResponse.Deposit> getDeposit(Principal principal, @PathVariable Long accountId) {
        return ResponseEntity.ok(service.getDeposit(currentUserId(principal), accountId));
    }

    @GetMapping("/installments/{accountId}")
    public ResponseEntity<SavingsResponse.Installment> getInstallment(Principal principal, @PathVariable Long accountId) {
        return ResponseEntity.ok(service.getInstallment(currentUserId(principal), accountId));
    }

    // 인증 모듈은 검증된 사용자 ID를 Principal.name으로 제공해야 한다.
    private Long currentUserId(Principal principal) {
        if (principal != null) {
            try {
                long userId = Long.parseLong(principal.getName());
                if (userId > 0) return userId;
            } catch (NumberFormatException ignored) {
                // 인증되지 않았거나 사용자 ID로 변환할 수 없는 주체는 거절한다.
            }
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다.");
    }
}
