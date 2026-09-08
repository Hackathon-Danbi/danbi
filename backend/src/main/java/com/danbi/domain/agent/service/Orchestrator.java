package com.danbi.domain.agent.service;

import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.llm.Prompts;
import com.danbi.domain.agent.llm.Schemas;
import com.danbi.domain.agent.model.AgentException;
import com.danbi.domain.agent.model.AgentModels.Decision;
import com.danbi.domain.agent.model.AgentModels.Reply;
import com.danbi.domain.agent.model.AgentOutcome;
import com.danbi.domain.agent.service.AgentSessions.Session;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class Orchestrator {
    private final AiGateway ai;
    private final Prompts prompts;
    private final FinanceAgent finance;
    private final SignupAgent signup;
    private final PracticeCoachAgent coach;
    private final Clock clock;
    public Orchestrator(AiGateway ai, Prompts prompts, FinanceAgent finance, SignupAgent signup,
            PracticeCoachAgent coach, Clock clock) {
        this.ai = ai; this.prompts = prompts; this.finance = finance; this.signup = signup; this.coach = coach; this.clock = clock;
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
                outcome = switch (decision.intent()) {
                    case BALANCE, TRANSACTIONS, TRANSFER, PRODUCT -> finance.run(decision, text, session);
                    case SIGNUP -> signup.run(text, session);
                    case PRACTICE -> coach.start(session);
                    case COACH -> coach.feedback(text, session);
                    default -> AgentOutcome.message("orchestrator", "잔액 조회, 송금 정보 입력, 가입 안내, 상품 설명, 연습을 도와드려요.");
                };
            }
            session.version++;
            session.lastReply = new Reply(session.version, outcome.agent(), outcome.text(), outcome.screen(), outcome.sources(), true);
            return session.lastReply;
        }
    }
}
