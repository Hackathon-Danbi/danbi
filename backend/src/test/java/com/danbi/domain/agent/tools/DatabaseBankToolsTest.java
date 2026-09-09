package com.danbi.domain.agent.tools;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.danbi.domain.account.entity.*;
import com.danbi.domain.account.repository.*;
import com.danbi.domain.agent.AgentTestSupport;
import com.danbi.domain.agent.llm.*;
import com.danbi.domain.agent.entity.AgentException;
import com.danbi.domain.agent.entity.AgentModels.*;
import com.danbi.domain.agent.entity.Screen;
import com.danbi.domain.agent.rag.KnowledgeStore;
import com.danbi.domain.agent.service.*;
import com.danbi.domain.agent.tools.BankingData.*;
import com.danbi.domain.transaction.entity.Transaction;
import com.danbi.domain.transaction.entity.TransactionType;
import com.danbi.domain.transaction.repository.TransactionRepository;
import com.danbi.domain.transfer.entity.SavedRecipient;
import com.danbi.domain.transfer.repository.SavedRecipientRepository;
import com.danbi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({DatabaseBankTools.class, DatabaseBankToolsTest.Config.class})
@org.springframework.test.context.jdbc.Sql("/agent-banking.sql")
class DatabaseBankToolsTest {
    @TestConfiguration
    static class Config {
        @Bean Clock clock() { return Clock.fixed(Instant.parse("2026-09-08T03:00:00Z"), ZoneId.of("Asia/Seoul")); }
    }
    @Autowired private DatabaseBankTools tools;
    @Autowired private AccountRepository accounts;
    @Autowired private AccountProductRepository products;
    @Autowired private UserRepository users;
    @Autowired private SavedRecipientRepository recipients;
    @Autowired private TransactionRepository transactions;
    @Autowired private EntityManager em;
    @Autowired private Clock clock;

    private void flush() { em.flush(); em.clear(); }
    private Account account() { return accounts.findByAccountIdAndUserId(1L, 1L).orElseThrow(); }
    private SavedRecipient minsu() { return recipients.findMatchingRecipients(account().getUserId(), "민수").getFirst(); }

    @Test void readsSqlRowsFromExistingTablesAndResolvesNamesAndMasksAccounts() {
        assertTrue(users.existsById(account().getUserId()));
        assertTrue(products.existsById(account().getProductId()));
        assertEquals(150000, tools.getBalance());
        assertEquals(2, tools.findRecipients("영희").size());
        assertEquals(1, tools.findRecipients("김영희").size());
        RecipientData recipient = tools.findRecipients("민수").getFirst();
        assertEquals(minsu().getSavedRecipientId().toString(), recipient.id());
        assertEquals("***1234", recipient.accountMasked());
        assertTrue(tools.findRecipients("없는사람").isEmpty());
    }

    @Test void readsDatabaseChangesAndDeletionsWithoutFallback() {
        account().withdraw(141000);
        minsu().updateLabels("김수정", "수정");
        recipients.deleteAll(recipients.findMatchingRecipients(account().getUserId(), "지영"));
        transactions.deleteAll();
        flush();
        long userCount = users.count(), productCount = products.count(), accountCount = accounts.count();
        flush();
        assertEquals(9000, tools.getBalance());
        assertTrue(tools.findRecipients("민수").isEmpty());
        assertTrue(tools.findRecipients("지영").isEmpty());
        assertEquals("김수정", tools.findRecipients("수정").getFirst().name());
        assertEquals(3, recipients.findByUserIdOrderBySavedRecipientIdDesc(account().getUserId()).size());
        assertEquals(0, transactions.count());
        assertEquals(userCount, users.count());
        assertEquals(productCount, products.count());
        assertEquals(accountCount, accounts.count());
        var error = assertThrows(BankingValidationException.class, () -> tools.createTransferPreview(
                new TransferPreviewRequest(tools.findRecipients("수정").getFirst().id(), 9001)));
        assertTrue(error.getMessage().contains("9,000"));
    }

    @Test void filtersByAccountAndInclusiveDatesAndConvertsWithdrawalSign() {
        LocalDate day = LocalDate.of(2026, 9, 7);
        Long id = account().getAccountId();
        transactions.save(tx(id, day.atTime(23, 59, 59), TransactionType.DEPOSIT, 700));
        transactions.save(tx(id, day.plusDays(1).atStartOfDay(), TransactionType.DEPOSIT, 800));
        Account other = otherAccount();
        transactions.save(tx(other.getAccountId(), day.atTime(12, 0), TransactionType.DEPOSIT, 999));
        flush();
        var rows = tools.getTransactions(new DateRange(day, day));
        assertEquals(2, rows.size());
        assertEquals(700, rows.getFirst().amount());
        assertEquals(-12000, rows.getLast().amount());
        assertEquals("연습 마트", rows.getLast().description());
        assertEquals(12000L, transactions.findByAccountIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
                id, day.atStartOfDay(), day.plusDays(1).atStartOfDay()).getLast().getAmount());
    }

    @Test void previewRejectsAnotherOwnersRecipientAndDoesNotMoveMoney() {
        Account other = otherAccount();
        em.createNativeQuery("INSERT INTO saved_recipients(saved_recipient_id,user_id,recipient_bank_code,recipient_account_number,recipient_name,nickname) VALUES(999,999,'004','777777779999','김민수','민수')").executeUpdate();
        SavedRecipient foreign = recipients.findById(999L).orElseThrow();
        flush();
        assertEquals(1, tools.findRecipients("민수").size());
        assertThrows(BankingValidationException.class, () -> tools.createTransferPreview(
                new TransferPreviewRequest(foreign.getSavedRecipientId().toString(), 100)));
        String id = tools.findRecipients("민수").getFirst().id();
        for (long amount : new long[]{0, -1, 150001}) {
            assertThrows(BankingValidationException.class, () -> tools.createTransferPreview(new TransferPreviewRequest(id, amount)));
        }
        assertThrows(BankingValidationException.class, () -> tools.createTransferPreview(new TransferPreviewRequest("invented", 1)));
        long count = transactions.count();
        assertEquals(150000, tools.createTransferPreview(new TransferPreviewRequest(id, 150000)).amount());
        flush();
        assertEquals(150000, tools.getBalance());
        assertEquals(count, transactions.count());
    }

    @Test void missingOrClosedAccountDoesNotProduceSuccessfulPreview() {
        Long id = account().getAccountId();
        em.createQuery("update Account a set a.accountStatus = :status where a.accountId = :id")
                .setParameter("status", AccountStatus.CLOSED).setParameter("id", id).executeUpdate();
        flush();
        assertThrows(BankingValidationException.class, () -> tools.createTransferPreview(
                new TransferPreviewRequest(minsu().getSavedRecipientId().toString(), 1)));
        accounts.deleteById(id);
        flush();
        assertThrows(AgentException.class, () -> tools.getBalance());
    }

    @Test void agentReplyUsesPersistedBalanceAndRecipientAndTransactions() {
        account().withdraw(60000);
        minsu().updateLabels("김수정", "수정");
        flush();
        AiGateway ai = mock(AiGateway.class);
        var easy = new EasyLanguageAgent(ai, new Prompts());
        var knowledge = mock(KnowledgeStore.class);
        var orchestrator = new Orchestrator(ai, new Prompts(), List.of(
                new FinanceAgent(tools, knowledge, easy, clock), new SignupAgent(knowledge, easy), new PracticeCoachAgent(easy)), clock);
        var sessions = new AgentSessions(clock, AgentTestSupport.properties());
        var session = sessions.require("Bearer " + sessions.create().token());
        when(ai.structured(anyString(), any(), anyMap(), eq(Decision.class))).thenReturn(
                new Decision(Intent.BALANCE, null, null, null, null, false),
                new Decision(Intent.TRANSFER, "수정", 30000L, null, null, false),
                new Decision(Intent.TRANSACTIONS, null, null, "2026-09-07", "2026-09-07", false));
        assertEquals(90000, assertInstanceOf(Screen.Balance.class, orchestrator.chat(session, "잔액").screen()).balance());
        var preview = assertInstanceOf(Screen.TransferConfirmation.class, orchestrator.chat(session, "수정에게 삼만 원").screen());
        assertEquals("김수정", preview.recipientName());
        assertEquals(30000, preview.amount());
        assertEquals(1, assertInstanceOf(Screen.Transactions.class, orchestrator.chat(session, "거래내역").screen()).items().size());
    }

    private Account otherAccount() {
        em.createNativeQuery("INSERT INTO users(user_id,name,simple_password_hash,identity_verified,certificate_issued,created_at) VALUES(999,'다른 사용자','!test',false,false,CURRENT_TIMESTAMP)").executeUpdate();
        em.createNativeQuery("INSERT INTO accounts(account_id,user_id,product_id,account_name,bank_name,account_number,balance,is_primary,account_status,created_at) VALUES(999,999,1,'다른 계좌','테스트','OTHER-ACCOUNT',777,false,'ACTIVE',CURRENT_TIMESTAMP)").executeUpdate();
        return accounts.findById(999L).orElseThrow();
    }
    private Transaction tx(Long accountId, LocalDateTime at, TransactionType type, long amount) {
        return Transaction.builder().accountId(accountId).transactionType(type).occurredAt(at).description("추가 거래").amount(amount).build();
    }
}
