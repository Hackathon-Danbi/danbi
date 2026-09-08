package com.danbi.domain.agent.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("danbi.agent")
public record AgentProperties(boolean enabled, String apiKey, String textModel,
        String embeddingModel, String sttModel, String ttsModel, double ragMinScore) {
}
