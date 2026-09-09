package com.danbi.domain.agent.model;

import com.danbi.domain.agent.model.AgentModels.Source;
import java.util.List;

public record AgentOutcome(String agent, String text, Screen screen, List<Source> sources) {
    public static AgentOutcome message(String agent, String text) {
        return new AgentOutcome(agent, text, new Screen.Message(), List.of());
    }
}
