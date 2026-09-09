package com.danbi.domain.agent.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.danbi.domain.agent.AgentTestSupport;
import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.llm.Prompts;
import com.danbi.domain.agent.model.AgentException;
import com.danbi.domain.agent.model.AgentModels.*;
import com.danbi.domain.agent.model.Screen;
import com.danbi.domain.agent.rag.KnowledgeStore;
import com.danbi.domain.agent.tools.DemoBankTools;
import com.danbi.support.MutableClock;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

class AgentFlowTest {
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
        app = new Orchestrator(ai, new Prompts(), List.of(new FinanceAgent(new DemoBankTools(clock), knowledge, easy, clock),
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
        assertEquals(150000L, new DemoBankTools(clock).getBalance());
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
}
