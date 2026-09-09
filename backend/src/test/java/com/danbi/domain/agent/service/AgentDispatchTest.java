package com.danbi.domain.agent.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.danbi.domain.agent.AgentTestSupport;
import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.llm.Prompts;
import com.danbi.domain.agent.entity.AgentModels.Decision;
import com.danbi.domain.agent.entity.AgentModels.Intent;
import com.danbi.domain.agent.entity.AgentOutcome;
import com.danbi.domain.agent.entity.AgentType;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AgentDispatchTest {
    @Test
    void dispatchesAllBusinessIntentsThroughTheInterface() {
        AiGateway ai = mock(AiGateway.class);
        DanbiAgent finance = agent(AgentType.FINANCE);
        DanbiAgent signup = agent(AgentType.SIGNUP);
        DanbiAgent practice = agent(AgentType.PRACTICE);
        var sessions = new AgentSessions(Clock.systemUTC(), AgentTestSupport.properties());
        var session = sessions.require("Bearer " + sessions.create().token());
        var router = new Orchestrator(ai, new Prompts(), List.of(finance, signup, practice), Clock.systemUTC());
        Map<Intent, DanbiAgent> expected = Map.of(Intent.BALANCE, finance, Intent.TRANSACTIONS, finance,
                Intent.TRANSFER, finance, Intent.PRODUCT, finance, Intent.SIGNUP, signup,
                Intent.PRACTICE, practice, Intent.COACH, practice);
        for (var entry : expected.entrySet()) {
            Decision decision = new Decision(entry.getKey(), null, null, null, null, false);
            when(ai.structured(anyString(), any(), anyMap(), eq(Decision.class))).thenReturn(decision);
            router.chat(session, "질문");
            verify(entry.getValue()).handle(argThat(c -> c.decision().equals(decision) && c.session() == session && c.text().equals("질문")));
        }
    }

    @Test
    void duplicateAndMissingRegistrationsFailAtConstruction() {
        AiGateway ai = mock(AiGateway.class);
        assertThrows(IllegalStateException.class, () -> new Orchestrator(ai, new Prompts(), List.of(), Clock.systemUTC()));
        assertThrows(IllegalStateException.class, () -> new Orchestrator(ai, new Prompts(),
                List.of(agent(AgentType.FINANCE), agent(AgentType.FINANCE)), Clock.systemUTC()));
    }

    private DanbiAgent agent(AgentType type) {
        DanbiAgent agent = mock(DanbiAgent.class);
        when(agent.supports()).thenReturn(type);
        when(agent.handle(any())).thenReturn(AgentOutcome.message(type.name().toLowerCase(), "안내"));
        return agent;
    }
}
