package com.danbi.domain.agent.entity;

import com.danbi.domain.agent.entity.AgentModels.Decision;
import com.danbi.domain.agent.service.AgentSessions.Session;
import java.util.Objects;

public record AgentContext(Decision decision, String text, Session session) {
    public AgentContext {
        Objects.requireNonNull(decision);
        Objects.requireNonNull(text);
        Objects.requireNonNull(session);
    }
}
