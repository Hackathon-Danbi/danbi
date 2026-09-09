package com.danbi.domain.agent.service;

import com.danbi.domain.agent.model.AgentContext;
import com.danbi.domain.agent.model.AgentOutcome;
import com.danbi.domain.agent.model.AgentType;

public interface DanbiAgent {
    AgentType supports();
    AgentOutcome handle(AgentContext context);
}
