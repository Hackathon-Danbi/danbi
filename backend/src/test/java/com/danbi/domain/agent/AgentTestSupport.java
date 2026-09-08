package com.danbi.domain.agent;

import com.danbi.domain.agent.config.AgentProperties;

public final class AgentTestSupport {
    private AgentTestSupport() {}
    public static AgentProperties properties() {
        return new AgentProperties(true, "fake-test-key", "gpt-5.6-terra", "text-embedding-3-small",
                "gpt-transcribe", "gpt-4o-mini-tts", 0.35);
    }
}
