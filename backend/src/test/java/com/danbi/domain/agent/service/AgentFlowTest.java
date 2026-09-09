package com.danbi.domain.agent.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.danbi.domain.agent.AgentTestSupport;
import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.llm.Prompts;
import com.danbi.domain.agent.entity.AgentException;
import com.danbi.domain.agent.entity.AgentModels.*;
import com.danbi.domain.agent.entity.Screen;
import com.danbi.domain.agent.rag.KnowledgeStore;
import com.danbi.domain.agent.tools.DatabaseBankTools;
import com.danbi.support.MutableClock;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

@org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
@org.springframework.context.annotation.Import(DatabaseBankTools.class)
@org.springframework.test.context.jdbc.Sql("/agent-banking.sql")
class AgentFlowTest {
    @org.springframework.beans.factory.annotation.Autowired private DatabaseBankTools tools;
    private final MutableClock clock = MutableClock.atSeoul(LocalDateTime.of(2026, 9, 8, 12, 0));
    private final AiGateway ai = mock(AiGateway.class);
    private final KnowledgeStore knowledge = mock(KnowledgeStore.class);
    private AgentSessions sessions;
    private Orchestrator app;
    private AgentSessions.Session session;

    @BeforeEach
    void setup() {
        sessions = new AgentSessions(clock, AgentTestSupport.properties());
        session = sessions.require("Bearer " + sessions.create().token());
        var easy = new EasyLanguageAgent(ai, new Prompts());
        app = new Orchestrator(ai, new Prompts(), List.of(new FinanceAgent(tools, knowledge, easy, clock),
                new SignupAgent(knowledge, easy), new PracticeCoachAgent(easy)), clock);
    }

    private Decision transfer(String recipient, Long amount) { return new Decision(Intent.TRANSFER, recipient, amount, null, null, false); }
    private void decisions(Decision first, Decision... next) {
        when(ai.structured(anyString(), any(), anyMap(), eq(Decision.class))).thenReturn(first, next);
    }

    @Test
    void collectsMissingFieldsCorrectsAmountAndCancelsWithoutMovingMoney() {
        decisions(transfer("민수", null), transfer(null, 30000L), transfer(null, 20000L),
                new Decision(Intent.CANCEL, null, null, null, null, false));
        assertEquals("얼마를 보낼까요?", app.chat(session, "민수에게 보내줘").text());
        assertEquals(30000L, assertInstanceOf(Screen.TransferConfirmation.class, app.chat(session, "삼만 원").screen()).amount());
        assertEquals(20000L, assertInstanceOf(Screen.TransferConfirmation.class, app.chat(session, "이만 원으로").screen()).amount());
        app.chat(session, "취소해");
        assertNull(session.amount);
        assertNull(session.recipient);
        assertEquals(150000L, tools.getBalance());
    }

    @Test
    void unclearInterpretationDoesNotOverwriteDraft() {
        decisions(transfer("민수", 30000L), new Decision(Intent.TRANSFER, "지영", 500000L, null, null, true));
        app.chat(session, "민수 삼만 원");
        assertEquals("message", app.chat(session, "오만인지 오십만인지").screen().type());
        assertEquals("민수", session.recipient);
        assertEquals(30000L, session.amount);
    }

    @Test
    void duplicateRecipientsAndOutOfRangeAmountsNeverCreateConfirmation() {
        decisions(transfer("영희", 30000L), transfer("김영희", -1L), transfer(null, 150001L));
        assertEquals("message", app.chat(session, "영희 삼만 원").screen().type());
        assertEquals("message", app.chat(session, "김영희 마이너스 일 원").screen().type());
        assertEquals("message", app.chat(session, "십오만 일 원").screen().type());
    }

    @Test
    void sessionsAreIsolatedExpireAndCanBeRevoked() {
        String token = sessions.create().token();
        var other = sessions.require("Bearer " + token);
        session.amount = 5000L;
        assertNull(other.amount);
        sessions.delete("Bearer " + token);
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(AgentException.class,
                () -> sessions.require("Bearer " + token)).status());
        clock.advanceSeconds(1800);
        assertThrows(AgentException.class, () -> app.chat(session, "잔액"));
        verifyNoInteractions(ai);
    }

    @Test
    void missingRagEvidenceSkipsAnswerGeneration() {
        decisions(new Decision(Intent.PRODUCT, null, null, null, null, false));
        when(knowledge.search(anyString(), eq("product"))).thenReturn(List.of());
        Reply reply = app.chat(session, "우대금리 얼마야");
        assertTrue(reply.sources().isEmpty());
        assertTrue(reply.text().contains("자료가 없어요"));
        verify(ai, times(1)).structured(anyString(), any(), anyMap(), any());
    }

    @Test
    void providerFailurePreservesLastResponseAndDraft() {
        session.amount = 30000L;
        when(ai.structured(anyString(), any(), anyMap(), eq(Decision.class)))
                .thenThrow(new AgentException(HttpStatus.BAD_GATEWAY, "AI unavailable"));
        assertThrows(AgentException.class, () -> app.chat(session, "수정"));
        assertEquals(30000L, session.amount);
        assertEquals(0, session.version);
    }

    @Test
    void speechRejectsStaleVersionAndAudioRejectsUnsupportedFiles() {
        VoiceAgent voice = new VoiceAgent(ai, app);
        assertEquals(HttpStatus.CONFLICT, assertThrows(AgentException.class, () -> voice.speech(session, 3)).status());
        assertThrows(AgentException.class, () -> voice.chat(session,
                new MockMultipartFile("file", "attack.txt", "text/plain", new byte[]{1})));
        verifyNoInteractions(ai);
    }

    @Test
    void practiceCountsCorrectionsFromServerState() {
        decisions(new Decision(Intent.PRACTICE, null, null, null, null, false), transfer("민수", 30000L), transfer(null, 20000L));
        app.chat(session, "연습 시작");
        app.chat(session, "민수 삼만 원");
        Reply reply = app.chat(session, "이만 원");
        assertEquals(1, session.amountCorrections);
        assertEquals(true, assertInstanceOf(Screen.TransferConfirmation.class, reply.screen()).practice());
    }

    @Test
    void currentMonthEndingInFutureIsClampedToToday() {
        decisions(new Decision(Intent.TRANSACTIONS, null, null, "2026-09-01", "2026-09-30", false));
        var screen = assertInstanceOf(Screen.Transactions.class, app.chat(session, "9월 거래내역").screen());
        assertEquals(java.time.LocalDate.of(2026, 9, 1), screen.from());
        assertEquals(java.time.LocalDate.of(2026, 9, 8), screen.to());
        assertEquals(2, screen.items().size());
    }

    @Test
    void historicalMonthIsPreservedAndInvalidRangesAreStillRejected() {
        decisions(new Decision(Intent.TRANSACTIONS, null, null, "2026-08-01", "2026-08-31", false),
                new Decision(Intent.TRANSACTIONS, null, null, "2026-10-01", "2026-10-31", false),
                new Decision(Intent.TRANSACTIONS, null, null, "2026-09-08", "2026-09-01", false),
                new Decision(Intent.TRANSACTIONS, null, null, "2024-01-01", "2026-09-30", false));
        var screen = assertInstanceOf(Screen.Transactions.class, app.chat(session, "8월 거래내역").screen());
        assertEquals(java.time.LocalDate.of(2026, 8, 31), screen.to());
        assertEquals("message", app.chat(session, "다음 달").screen().type());
        assertEquals("message", app.chat(session, "역전 기간").screen().type());
        assertEquals("message", app.chat(session, "1년 초과").screen().type());
    }

    @Test
    void missingRecipientIsCollectedWithoutDiscardingAmount() {
        decisions(transfer(null, 30000L), transfer("민수", null));
        assertEquals("누구에게 보낼까요?", app.chat(session, "삼만 원 보내줘").text());
        assertEquals(30000L, session.amount);
        var preview = assertInstanceOf(Screen.TransferConfirmation.class, app.chat(session, "민수").screen());
        assertEquals("김민수", preview.recipientName());
        assertEquals(30000L, preview.amount());
    }

    @Test
    void speechUsesValidatedDigitsWithoutSpeakingMaskOrChangingVisibleText() {
        decisions(transfer("민수", 30000L));
        Reply reply = app.chat(session, "민수 삼만 원");
        new VoiceAgent(ai, app).speech(session, reply.version());
        verify(ai).speech("김민수 님에게 30,000원을 보내는 모의 확인 화면이에요. 계좌번호 끝 네 자리는 일, 이, 삼, 사입니다. 실제 돈은 보내지 않았어요.");
        assertEquals(reply, session.lastReply);
        assertTrue(reply.text().contains("***1234"));
        assertEquals("***1234", assertInstanceOf(Screen.TransferConfirmation.class, reply.screen()).accountMasked());
    }

    @Test
    void speechPreservesLeadingZerosAndNeverInventsHiddenDigits() {
        VoiceAgent voice = new VoiceAgent(ai, app);
        session.version = 1;
        session.lastReply = new Reply(1, "finance", "화면 안내", new Screen.TransferConfirmation(
                "1", "김민수", "***0001", 100, "KRW", true), List.of(), true);
        voice.speech(session, 1);
        verify(ai).speech("김민수 님에게 100원을 보내는 모의 확인 화면이에요. 계좌번호 끝 네 자리는 공, 공, 공, 일입니다. 실제 돈은 보내지 않았어요.");
        session.lastReply = new Reply(1, "finance", "화면 안내", new Screen.TransferConfirmation(
                "1", "김민수", "***", 100, "KRW", true), List.of(), true);
        voice.speech(session, 1);
        verify(ai).speech("김민수 님에게 100원을 보내는 모의 확인 화면이에요. 계좌번호 일부는 표시하지 않아요. 실제 돈은 보내지 않았어요.");
    }

}
