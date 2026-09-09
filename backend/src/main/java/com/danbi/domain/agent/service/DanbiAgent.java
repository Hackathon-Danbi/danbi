package com.danbi.domain.agent.service;

import com.danbi.domain.agent.entity.AgentContext;
import com.danbi.domain.agent.entity.AgentOutcome;
import com.danbi.domain.agent.entity.AgentType;

public interface DanbiAgent {
    AgentType supports();
    AgentOutcome handle(AgentContext context);
}
