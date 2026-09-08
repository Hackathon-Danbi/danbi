package com.danbi.domain.savings.service;

import com.danbi.domain.account.entity.Account;
import com.danbi.domain.account.entity.ProductType;
import com.danbi.domain.account.repository.AccountRepository;
import com.danbi.domain.savings.dto.SavingsResponse.*;
import com.danbi.domain.savings.entity.SavingsContract;
import com.danbi.domain.savings.repository.MonthlySavingsPaymentRepository;
import com.danbi.domain.savings.repository.SavingsContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SavingsService {
    private static final List<ProductType> SAVINGS_TYPES = List.of(
            ProductType.TIME_DEPOSIT, ProductType.FIXED_SAVINGS, ProductType.FREE_SAVINGS);
    private final AccountRepository accounts;
    private final SavingsContractRepository contracts;
    private final MonthlySavingsPaymentRepository payments;
    private final Clock clock;

    public AccountList getSavings(Long userId) {
        var ownedAccounts = accounts.findByUserIdAndProductProductTypeInOrderByAccountIdAsc(userId, SAVINGS_TYPES);
        if (ownedAccounts.isEmpty()) return new AccountList(List.of());
        LocalDate today = LocalDate.now(clock);
        var byAccount = contracts.findByAccountAccountIdIn(ownedAccounts.stream().map(Account::getAccountId).toList())
                .stream().collect(Collectors.toMap(c -> c.getAccount().getAccountId(), Function.identity()));
        Map<Long, CurrentMonthPayment> byContract = byAccount.isEmpty() ? Map.of() : payments
                .findByContractContractIdInAndPaymentMonth(byAccount.values().stream()
                        .map(SavingsContract::getContractId).toList(), YearMonth.from(today).toString())
                .stream().collect(Collectors.toMap(p -> p.getContract().getContractId(), CurrentMonthPayment::from));
        return new AccountList(ownedAccounts.stream().map(account -> {
            var contract = byAccount.get(account.getAccountId());
            var product = account.getProduct();
            return new Summary(account.getAccountId(), product.getProductName(), product.getProductType(),
                    account.getBalance(), contract == null ? null : contract.getAppliedInterestRate(),
                    contract == null ? null : contract.getMaturityAt(),
                    contract == null ? 0 : Math.max(0, ChronoUnit.MONTHS.between(today, contract.getMaturityAt())),
                    contract == null || product.getProductType() == ProductType.TIME_DEPOSIT
                            ? null : byContract.get(contract.getContractId()));
        }).toList());
    }

    public Deposit getDeposit(Long userId, Long accountId) {
        var account = ownedAccount(userId, accountId);
        if (account.getProduct().getProductType() != ProductType.TIME_DEPOSIT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "예금 계좌가 아닙니다.");
        }
        var contract = requiredContract(accountId);
        var product = account.getProduct();
        return new Deposit(accountId, contract.getContractId(), product.getProductName(), product.getProductType(),
                account.getBalance(), contract.getAppliedInterestRate(), contract.getExpectedMaturityAmount(),
                contract.getOpenedAt(), contract.getMaturityAt(), product.isAdditionalPaymentAllowed());
    }

    public Installment getInstallment(Long userId, Long accountId) {
        var account = ownedAccount(userId, accountId);
        var product = account.getProduct();
        if (product.getProductType() != ProductType.FIXED_SAVINGS && product.getProductType() != ProductType.FREE_SAVINGS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "적금 계좌가 아닙니다.");
        }
        var contract = requiredContract(accountId);
        var payment = payments.findByContractContractIdAndPaymentMonth(contract.getContractId(),
                YearMonth.now(clock).toString()).map(CurrentMonthPayment::from).orElse(null);
        return new Installment(accountId, contract.getContractId(), product.getProductName(), product.getProductType(),
                account.getBalance(), contract.getAppliedInterestRate(), contract.getExpectedMaturityAmount(),
                contract.getMaturityAt(), payment);
    }

    private Account ownedAccount(Long userId, Long accountId) {
        if (accountId == null || accountId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 계좌 ID입니다.");
        }
        return accounts.findByAccountIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "계좌를 찾을 수 없습니다."));
    }

    private SavingsContract requiredContract(Long accountId) {
        return contracts.findByAccountAccountId(accountId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "가입 계약 정보가 없습니다."));
    }
}
