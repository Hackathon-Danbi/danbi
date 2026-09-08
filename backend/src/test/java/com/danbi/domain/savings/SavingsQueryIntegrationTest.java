package com.danbi.domain.savings;

import com.danbi.domain.account.entity.*;
import com.danbi.domain.savings.entity.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Import(SavingsQueryIntegrationTest.TestClock.class)
class SavingsQueryIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired EntityManager em;

    @TestConfiguration
    static class TestClock {
        @Bean @Primary
        Clock testClock() {
            // UTC 8월 31일이지만 한국은 9월 1일이다.
            return Clock.fixed(Instant.parse("2026-08-31T16:00:00Z"), ZoneId.of("Asia/Seoul"));
        }
    }

    @Test
    void listIncludesOnlyOwnedSavingsAndCurrentMonthPayments() throws Exception {
        var deposit = contract(account(1L, ProductType.TIME_DEPOSIT), "2027-08-25");
        var fixed = contract(account(1L, ProductType.FIXED_SAVINGS), "2026-09-30");
        var free = contract(account(1L, ProductType.FREE_SAVINGS), "2026-08-31");
        account(1L, ProductType.CHECKING);
        contract(account(2L, ProductType.FIXED_SAVINGS), "2027-08-25");
        payment(fixed, "2026-09", PaymentStatus.PAID, 300000L);
        payment(free, "2026-08", PaymentStatus.UNPAID, null);
        payment(deposit, "2026-09", PaymentStatus.SCHEDULED, null);
        flush();
        mvc.perform(get("/api/savings").principal(() -> "1"))
                .andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.savings.length()").value(3))
                .andExpect(jsonPath("$.savings[0].productType").value("TIME_DEPOSIT"))
                .andExpect(jsonPath("$.savings[0].remainingMonths").value(11))
                .andExpect(jsonPath("$.savings[0].maturityAt").value("2027-08-25"))
                .andExpect(jsonPath("$.savings[0].currentMonthPayment").value(nullValue()))
                .andExpect(jsonPath("$.savings[1].remainingMonths").value(0))
                .andExpect(jsonPath("$.savings[1].currentMonthPayment.paymentDate").value("2026-09-25"))
                .andExpect(jsonPath("$.savings[1].currentMonthPayment.scheduledAmount").value(300000))
                .andExpect(jsonPath("$.savings[1].currentMonthPayment.amount").value(300000))
                .andExpect(jsonPath("$.savings[1].currentMonthPayment.status").value("PAID"))
                .andExpect(jsonPath("$.savings[2].remainingMonths").value(0))
                .andExpect(jsonPath("$.savings[2].currentMonthPayment").value(nullValue()));
    }

    @Test
    void emptyListAndMissingContractListFallback() throws Exception {
        mvc.perform(get("/api/savings").principal(() -> "1"))
                .andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith("application/json")).andExpect(content().json("{\"savings\":[]}"));
        account(1L, ProductType.TIME_DEPOSIT);
        flush();
        mvc.perform(get("/api/savings").principal(() -> "1"))
                .andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.savings[0].appliedInterestRate").value(nullValue()))
                .andExpect(jsonPath("$.savings[0].remainingMonths").value(0));
    }

    @Test
    void depositReturnsContractRateAndProductDetails() throws Exception {
        var c = contract(account(1L, ProductType.TIME_DEPOSIT), "2027-08-25");
        long id = c.getAccount().getAccountId();
        long contractId = c.getContractId();
        flush();
        mvc.perform(get("/api/savings/deposits/{id}", id).principal(() -> "1"))
                .andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(content().json("""
                        {"accountId":%d,"contractId":%d,"productName":"테스트 상품",
                         "productType":"TIME_DEPOSIT","balance":10000000,"appliedInterestRate":3.2,
                         "expectedMaturityAmount":10320000,"openedAt":"2026-08-25",
                         "maturityAt":"2027-08-25","additionalPaymentAllowed":false}
                        """.formatted(id, contractId)));
    }

    @Test
    void bothInstallmentTypesAndNullablePayments() throws Exception {
        for (var type : new ProductType[]{ProductType.FIXED_SAVINGS, ProductType.FREE_SAVINGS}) {
            var c = contract(account(1L, type), "2027-08-25");
            long id = c.getAccount().getAccountId();
            mvc.perform(get("/api/savings/installments/{id}", id).principal(() -> "1"))
                    .andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith("application/json"))
                    .andExpect(jsonPath("$.productType").value(type.name()))
                    .andExpect(jsonPath("$.contractId").value(c.getContractId()))
                    .andExpect(jsonPath("$.expectedMaturityAmount").value(10320000))
                    .andExpect(jsonPath("$.currentMonthPayment").value(nullValue()));
            payment(c, "2026-09", PaymentStatus.SCHEDULED, null);
            flush();
            mvc.perform(get("/api/savings/installments/{id}", id).principal(() -> "1"))
                    .andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith("application/json"))
                    .andExpect(jsonPath("$.currentMonthPayment.status").value("SCHEDULED"))
                    .andExpect(jsonPath("$.currentMonthPayment.amount").value(nullValue()));
        }
    }

    @Test
    void authenticationIsRequiredAndCallerHeadersCannotImpersonate() throws Exception {
        for (var path : new String[]{"/api/savings", "/api/savings/deposits/1", "/api/savings/installments/1"}) {
            mvc.perform(get(path).header("X-User-Id", "1")) .andExpect(status().isUnauthorized());
            mvc.perform(get(path).principal(() -> "invalid")).andExpect(status().isUnauthorized());
            mvc.perform(get(path).principal(() -> "0")).andExpect(status().isUnauthorized());
        }
    }

    @Test
    void detailsEnforceOwnershipTypesIdsAndRequiredContracts() throws Exception {
        var deposit = account(1L, ProductType.TIME_DEPOSIT);
        var installment = account(1L, ProductType.FREE_SAVINGS);
        var checking = account(1L, ProductType.CHECKING);
        long depositId = deposit.getAccountId();
        long installmentId = installment.getAccountId();
        long checkingId = checking.getAccountId();
        flush();
        for (var category : new String[]{"deposits", "installments"}) {
            var base = "/api/savings/" + category + "/";
            for (var invalid : new String[]{"0", "-1", "abc", "9223372036854775808"}) {
                mvc.perform(get(base + invalid).principal(() -> "1")).andExpect(status().isBadRequest());
            }
            mvc.perform(get(base + "999999").principal(() -> "1")).andExpect(status().isNotFound());
            mvc.perform(get(base + depositId).principal(() -> "2")).andExpect(status().isNotFound());
            mvc.perform(get(base + checkingId).principal(() -> "1")).andExpect(status().isBadRequest());
            long wrongType = category.equals("deposits") ? installmentId : depositId;
            long noContract = category.equals("deposits") ? depositId : installmentId;
            mvc.perform(get(base + wrongType).principal(() -> "1")).andExpect(status().isBadRequest());
            mvc.perform(get(base + noContract).principal(() -> "1")).andExpect(status().isInternalServerError());
        }
    }

    private Account account(Long userId, ProductType type) {
        var product = AccountProduct.builder().productName("테스트 상품").productType(type)
                .baseInterestRate(new BigDecimal("1.00")).build();
        em.persist(product);
        var account = Account.builder().userId(userId).product(product).accountName("테스트 계좌")
                .accountNumber(java.util.UUID.randomUUID().toString().substring(0, 30)).balance(10000000L).build();
        em.persist(account);
        return account;
    }

    private SavingsContract contract(Account account, String maturity) {
        var contract = SavingsContract.builder().account(account).appliedInterestRate(new BigDecimal("3.20"))
                .openedAt(LocalDate.parse("2026-08-25")).maturityAt(LocalDate.parse(maturity))
                .expectedMaturityAmount(10320000L).build();
        em.persist(contract);
        return contract;
    }

    private void payment(SavingsContract contract, String month, PaymentStatus status, Long amount) {
        em.persist(MonthlySavingsPayment.builder().contract(contract).paymentMonth(month)
                .dueDate(YearMonth.parse(month).atDay(25)).scheduledAmount(300000L).amount(amount).status(status).build());
    }

    private void flush() {
        em.flush();
        em.clear();
    }
}
