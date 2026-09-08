package com.danbi.domain.agent.service;

import com.danbi.domain.agent.model.AgentOutcome;
import com.danbi.domain.agent.rag.KnowledgeStore;
import com.danbi.domain.agent.service.AgentSessions.Session;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class SignupAgent {
    private final KnowledgeStore knowledge;
    private final EasyLanguageAgent easy;
    public SignupAgent(KnowledgeStore knowledge, EasyLanguageAgent easy) { this.knowledge = knowledge; this.easy = easy; }
    public AgentOutcome run(String question, Session session) {
        var answer = easy.grounded("signup", question, Map.of("step", session.signupStep, "demo", true),
                knowledge.search(question, "signup"));
        session.task = "SIGNUP";
        return new AgentOutcome("signup", answer.text(), Map.of("type", "signup_guide", "step", session.signupStep), answer.sources());
    }
}
