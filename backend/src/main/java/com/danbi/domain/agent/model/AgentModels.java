package com.danbi.domain.agent.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public final class AgentModels {
    private AgentModels() {}
    public enum Intent { BALANCE, TRANSACTIONS, TRANSFER, SIGNUP, PRODUCT, PRACTICE, COACH, CANCEL, OTHER }
    public record ChatRequest(@NotBlank @Size(max = 2000) String text) {}
    public record SpeechRequest(long version) {}
    public record Decision(Intent intent, String recipient, Long amount,
            String startDate, String endDate, boolean unclear) {}
    public record GroundedAnswer(boolean supported, String text, List<String> sourceIds) {}
    public record Source(String id, String title, String version, String reference, String excerpt) {}
    public record Reply(long version, String agent, String text, Map<String, Object> screen,
            List<Source> sources, boolean demo) {}
    public record SessionToken(String token, long expiresInSeconds, boolean demo) {}
    public record VoiceReply(String transcript, Reply reply) {}
}
