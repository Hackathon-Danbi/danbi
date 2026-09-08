package com.danbi.domain.agent.model;

import com.danbi.domain.agent.model.AgentModels.Source;
import java.util.List;
import java.util.Map;

public record AgentOutcome(String agent, String text, Map<String, Object> screen, List<Source> sources) {
    public static AgentOutcome message(String agent, String text) {
        return new AgentOutcome(agent, text, Map.of("type", "message"), List.of());
    }
}
