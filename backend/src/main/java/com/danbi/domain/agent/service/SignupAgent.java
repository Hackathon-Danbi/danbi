package com.danbi.domain.agent.service;

import com.danbi.domain.agent.entity.AgentOutcome;
import com.danbi.domain.agent.entity.AgentContext;
import com.danbi.domain.agent.entity.AgentType;
import com.danbi.domain.agent.entity.Screen;
import com.danbi.domain.agent.rag.KnowledgeStore;
import com.danbi.domain.agent.service.AgentSessions.Session;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class SignupAgent implements DanbiAgent {
    private final KnowledgeStore knowledge;
    private final EasyLanguageAgent easy;
    public SignupAgent(KnowledgeStore knowledge, EasyLanguageAgent easy) { this.knowledge = knowledge; this.easy = easy; }
    @Override public AgentType supports() { return AgentType.SIGNUP; }
    @Override public AgentOutcome handle(AgentContext context) {
        String question = context.text();
        Session session = context.session();
        var answer = easy.grounded("signup", question, Map.of("step", session.signupStep, "demo", true),
                knowledge.search(question, "signup"));
        session.task = "SIGNUP";
        return new AgentOutcome("signup", answer.text(), new Screen.SignupGuide(session.signupStep), answer.sources());
    }
}
