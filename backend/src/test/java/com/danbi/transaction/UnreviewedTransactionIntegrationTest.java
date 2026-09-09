package com.danbi.transaction;

import com.danbi.domain.account.entity.*;
import com.danbi.domain.transaction.entity.*;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.*;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.json.JsonCompareMode;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Import(UnreviewedTransactionIntegrationTest.TestClock.class)
class UnreviewedTransactionIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired EntityManager em;
    static final String SUMMARY = "/api/v1/unreviewed-transactions/summary";
    static final String COUNTS = "/api/v1/accounts/unreviewed-transaction-counts";
    static final String LIST = "/api/v1/accounts/{id}/unreviewed-transactions";

    @TestConfiguration
    static class TestClock {
        @Bean @Primary Clock testClock() {
            return Clock.fixed(Instant.parse("2026-09-08T16:00:00Z"), ZoneId.of("Asia/Seoul"));
        }
    }

    // Notion API examples checked on 2026-09-09. Generated IDs are substituted.
    @Test
    void notionSummaryExampleMatchesEntireResponse() throws Exception {
        notionExampleAccounts();
        mvc.perform(get(SUMMARY)).andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(content().json("{\"unreviewedDays\":7,\"unreviewedCount\":4}", JsonCompareMode.STRICT));
    }

    @Test
    void notionAccountCountsExampleMatchesEntireResponse() throws Exception {
        var accounts = notionExampleAccounts();
        mvc.perform(get(COUNTS)).andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(content().json("""
                    {"unreviewedDays":7,"accounts":[
                      {"accountId":%d,"accountName":"생활비 통장","bankName":"KB국민은행","accountNumberLast4":"3456","unreviewedCount":2},
                      {"accountId":%d,"accountName":"연금 통장","bankName":"KB국민은행","accountNumberLast4":"7821","unreviewedCount":1},
                      {"accountId":%d,"accountName":"저축 통장","bankName":"우리은행","accountNumberLast4":"1190","unreviewedCount":1}
                    ]}
                    """.formatted(accounts[0].getAccountId(), accounts[1].getAccountId(), accounts[2].getAccountId()), JsonCompareMode.STRICT));
    }

    @Test
    void notionTransactionExampleMatchesEntireResponseInLatestFirstOrder() throws Exception {
        var account = account(1L, "KB국민은행", "100-123-3456");
        var first = tx(account, "2026-09-02T14:10:00", ReviewStatus.PENDING, PaymentMethod.CHECK_CARD, 780000L);
        var second = Transaction.builder().accountId(account.getAccountId()).description("백화점 결제")
                .transactionType(TransactionType.WITHDRAWAL).paymentMethod(PaymentMethod.CHECK_CARD)
                .amount(620000L).occurredAt(LocalDateTime.parse("2026-09-03T18:40:00"))
                .reviewStatus(ReviewStatus.PENDING).build();
        em.persist(second);
        flush();
        mvc.perform(get(LIST, account.getAccountId())).andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(content().json("""
                    {"accountId":%d,"accountName":"생활비 통장","bankName":"KB국민은행",
                     "accountNumberLast4":"3456","unreviewedCount":2,"transactions":[
                      {"transactionId":%d,"occurredAt":"2026-09-03T18:40:00","description":"백화점 결제",
                       "transactionType":"WITHDRAWAL","paymentMethod":"CHECK_CARD","amount":620000,"reviewStatus":"PENDING"},
                      {"transactionId":%d,"occurredAt":"2026-09-02T14:10:00","description":"전자제품 매장",
                       "transactionType":"WITHDRAWAL","paymentMethod":"CHECK_CARD","amount":780000,"reviewStatus":"PENDING"}
                    ]}
                    """.formatted(account.getAccountId(), second.getTransactionId(), first.getTransactionId()), JsonCompareMode.STRICT));
    }

    private Account[] notionExampleAccounts() {
        var first = account(1L, "KB국민은행", "100-123-3456", "생활비 통장");
        var second = account(1L, "KB국민은행", "200-123-7821", "연금 통장");
        var third = account(1L, "우리은행", "300-123-1190", "저축 통장");
        tx(first, "2026-09-02T14:10:00", ReviewStatus.PENDING, PaymentMethod.CHECK_CARD, 780000L);
        tx(first, "2026-09-03T18:40:00", ReviewStatus.PENDING, PaymentMethod.CHECK_CARD, 620000L);
        tx(second, "2026-09-04T10:00:00", ReviewStatus.PENDING, PaymentMethod.TRANSFER, 100L);
        tx(third, "2026-09-05T10:00:00", ReviewStatus.PENDING, PaymentMethod.AUTO_TRANSFER, 200L);
        flush();
        return new Account[]{first, second, third};
    }

    @Test
    void summaryAndCountsUseOwnedPendingTransactionsAndKoreanDate() throws Exception {
        var first = account(1L, "KB국민은행", "100-123-3456");
        var second = account(1L, "우리은행", "200-123-7821");
        var empty = account(1L, "KB국민은행", "300-123-1190");
        var other = account(2L, "우리은행", "400-123-1111");
        tx(first, "2026-09-02T23:59:00", ReviewStatus.PENDING, null, 100L);
        tx(first, "2026-09-09T00:00:00", ReviewStatus.PENDING, null, 200L);
        tx(second, "2026-09-08T00:00:00", ReviewStatus.PENDING, null, 300L);
        tx(first, "2026-08-01T00:00:00", ReviewStatus.KNOWN, null, 400L);
        tx(second, "2026-08-01T00:00:00", ReviewStatus.UNKNOWN, null, 500L);
        tx(other, "2025-01-01T00:00:00", ReviewStatus.PENDING, null, 600L);
        flush();
        mvc.perform(get(SUMMARY)).andExpect(status().isOk())
                .andExpect(content().json("{\"unreviewedDays\":7,\"unreviewedCount\":3}"));
        mvc.perform(get(COUNTS)).andExpect(status().isOk())
                .andExpect(jsonPath("$.unreviewedDays").value(7))
                .andExpect(jsonPath("$.accounts.length()").value(3))
                .andExpect(jsonPath("$.accounts[0].accountId").value(first.getAccountId()))
                .andExpect(jsonPath("$.accounts[0].accountNumberLast4").value("3456"))
                .andExpect(jsonPath("$.accounts[0].unreviewedCount").value(2))
                .andExpect(jsonPath("$.accounts[1].bankName").value("우리은행"))
                .andExpect(jsonPath("$.accounts[1].unreviewedCount").value(1))
                .andExpect(jsonPath("$.accounts[2].accountId").value(empty.getAccountId()))
                .andExpect(jsonPath("$.accounts[2].unreviewedCount").value(0))
                .andExpect(jsonPath("$.accounts[0].accountNumber").doesNotExist());
    }

    @Test
    void listMatchesContractSortsDeterministicallyAndDoesNotReview() throws Exception {
        var a = account(1L, "우리은행", "100-123-3456");
        tx(a, "2026-09-02T14:10:00", ReviewStatus.PENDING, PaymentMethod.CHECK_CARD, -780000L);
        var latest = tx(a, "2026-09-03T18:40:00", ReviewStatus.PENDING, null, 620000L);
        var tie = tx(a, "2026-09-03T18:40:00", ReviewStatus.PENDING, PaymentMethod.TRANSFER, 10L);
        tx(a, "2026-09-04T18:40:00", ReviewStatus.KNOWN, null, 100L);
        flush();
        mvc.perform(get(LIST, a.getAccountId())).andExpect(status().isOk())
                .andExpect(jsonPath("$.accountName").value("생활비 통장"))
                .andExpect(jsonPath("$.bankName").value("우리은행"))
                .andExpect(jsonPath("$.accountNumberLast4").value("3456"))
                .andExpect(jsonPath("$.unreviewedCount").value(3))
                .andExpect(jsonPath("$.transactions.length()").value(3))
                .andExpect(jsonPath("$.transactions[0].transactionId").value(tie.getTransactionId()))
                .andExpect(jsonPath("$.transactions[0].paymentMethod").value("TRANSFER"))
                .andExpect(jsonPath("$.transactions[1].transactionId").value(latest.getTransactionId()))
                .andExpect(jsonPath("$.transactions[1].paymentMethod").value(nullValue()))
                .andExpect(jsonPath("$.transactions[2].amount").value(780000))
                .andExpect(jsonPath("$.transactions[2].transactionType").value("WITHDRAWAL"))
                .andExpect(jsonPath("$.transactions[2].paymentMethod").value("CHECK_CARD"))
                .andExpect(jsonPath("$.transactions[2].reviewStatus").value("PENDING"));
        mvc.perform(get(SUMMARY)).andExpect(jsonPath("$.unreviewedCount").value(3));
    }

    @Test
    void emptyAndTodayOnlyResults() throws Exception {
        mvc.perform(get(SUMMARY)).andExpect(status().isOk())
                .andExpect(content().json("{\"unreviewedDays\":0,\"unreviewedCount\":0}"));
        mvc.perform(get(COUNTS)).andExpect(status().isOk())
                .andExpect(content().json("{\"unreviewedDays\":0,\"accounts\":[]}"));
        var a = account(1L, "KB국민은행", "100-123-3456");
        mvc.perform(get(LIST, a.getAccountId())).andExpect(status().isOk())
                .andExpect(jsonPath("$.transactions").isEmpty()).andExpect(jsonPath("$.unreviewedCount").value(0));
        tx(a, "2026-09-09T00:00:00", ReviewStatus.PENDING, PaymentMethod.AUTO_TRANSFER, 100L);
        flush();
        mvc.perform(get(SUMMARY)).andExpect(status().isOk())
                .andExpect(content().json("{\"unreviewedDays\":0,\"unreviewedCount\":1}"));
    }

    @Test
    void usesFixedUserAndEnforcesOwnershipAndValidIds() throws Exception {
        var a = account(2L, "KB국민은행", "100-123-3456");
        flush();
        for (String path : new String[]{SUMMARY, COUNTS}) {
            mvc.perform(get(path).header("X-User-Id", "2").principal(() -> "2"))
                    .andExpect(status().isOk());
        }
        mvc.perform(get(COUNTS).principal(() -> "2"))
                .andExpect(jsonPath("$.accounts").isEmpty());
        for (String id : new String[]{"0", "-1", "abc", "9223372036854775808"}) {
            mvc.perform(get(LIST, id)).andExpect(status().isBadRequest());
        }
        mvc.perform(get(LIST, a.getAccountId())).andExpect(status().isNotFound());
        mvc.perform(get(LIST, 999999)).andExpect(status().isNotFound());
    }

    private Account account(Long userId, String bank, String number) {
        return account(userId, bank, number, "생활비 통장");
    }

    private Account account(Long userId, String bank, String number, String name) {
        var product = AccountProduct.builder().productName("입출금 상품").productType(ProductType.CHECKING)
                .baseInterestRate(BigDecimal.ZERO).build();
        em.persist(product);
        var account = Account.builder().userId(userId).product(product).accountName(name)
                .bankName(bank).accountNumber(number).build();
        em.persist(account);
        return account;
    }
    private Transaction tx(Account account, String date, ReviewStatus status, PaymentMethod method, Long amount) {
        var transaction = Transaction.builder().accountId(account.getAccountId())
                .description("전자제품 매장").transactionType(TransactionType.WITHDRAWAL)
                .paymentMethod(method).amount(amount).occurredAt(LocalDateTime.parse(date)).reviewStatus(status).build();
        em.persist(transaction);
        return transaction;
    }
    private void flush() { em.flush(); em.clear(); }
}
