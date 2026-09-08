package com.danbi.domain.agent.service;

import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.llm.Prompts;
import com.danbi.domain.agent.llm.Schemas;
import com.danbi.domain.agent.model.AgentException;
import com.danbi.domain.agent.model.AgentModels.Decision;
import com.danbi.domain.agent.model.AgentModels.Reply;
import com.danbi.domain.agent.model.AgentOutcome;
import com.danbi.domain.agent.model.AgentContext;
import com.danbi.domain.agent.model.AgentType;
import com.danbi.domain.agent.service.AgentSessions.Session;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class Orchestrator {
    private final AiGateway ai;
    private final Prompts prompts;
    private final Map<AgentType, DanbiAgent> agents;
    private final Clock clock;
    public Orchestrator(AiGateway ai, Prompts prompts, List<DanbiAgent> agents, Clock clock) {
        this.ai = ai; this.prompts = prompts; this.clock = clock;
        Map<AgentType, DanbiAgent> registry = new EnumMap<>(AgentType.class);
        for (DanbiAgent agent : agents) {
            if (registry.putIfAbsent(agent.supports(), agent) != null) {
                throw new IllegalStateException("Duplicate agent type: " + agent.supports());
            }
        }
        for (AgentType type : AgentType.values()) {
            if (!registry.containsKey(type)) throw new IllegalStateException("Missing agent type: " + type);
        }
        this.agents = Map.copyOf(registry);
    }

    public Reply chat(Session session, String text) {
        synchronized (session) {
            if (!session.expiresAt.isAfter(clock.instant())) throw new AgentException(HttpStatus.UNAUTHORIZED, "대화를 다시 시작해 주세요.");
            Map<String, Object> context = new LinkedHashMap<>();
            context.put("text", text); context.put("task", session.task);
            context.put("recipient", session.recipient); context.put("amount", session.amount);
            context.put("lastQuestion", session.lastReply == null ? "" : session.lastReply.text());
            context.put("today", LocalDate.now(clock).toString());
            Decision decision = ai.structured(prompts.load("router"), context, Schemas.DECISION, Decision.class);
            if (decision.intent() == null) throw new AgentException(HttpStatus.BAD_GATEWAY, "요청을 다시 말씀해 주세요.");
            AgentOutcome outcome;
            if (decision.intent() == com.danbi.domain.agent.model.AgentModels.Intent.CANCEL) {
                session.clearDraft(); session.practice = false;
                outcome = AgentOutcome.message("orchestrator", "진행하던 입력을 취소했어요.");
            } else if (decision.unclear()) {
                outcome = AgentOutcome.message("orchestrator", "요청이 명확하지 않아요. 이름이나 금액, 원하는 업무를 다시 말씀해 주세요.");
            } else {
                AgentType type = switch (decision.intent()) {
                    case BALANCE, TRANSACTIONS, TRANSFER, PRODUCT -> AgentType.FINANCE;
                    case SIGNUP -> AgentType.SIGNUP;
                    case PRACTICE, COACH -> AgentType.PRACTICE;
                    default -> null;
                };
                outcome = type == null
                        ? AgentOutcome.message("orchestrator", "잔액 조회, 송금 정보 입력, 가입 안내, 상품 설명, 연습을 도와드려요.")
                        : agents.get(type).handle(new AgentContext(decision, text, session));
            }
            session.version++;
            session.lastReply = new Reply(session.version, outcome.agent(), outcome.text(), outcome.screen(), outcome.sources(), true);
            return session.lastReply;
        }
    }
}
