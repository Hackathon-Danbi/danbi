package com.danbi.domain.agent.service;

import com.danbi.domain.agent.config.AgentProperties;
import com.danbi.domain.agent.model.AgentException;
import com.danbi.domain.agent.model.AgentModels.Reply;
import com.danbi.domain.agent.model.AgentModels.SessionToken;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Opt-in demo capability tokens, NOT customer login credentials. Single-instance, 30 minute TTL. */
@Service
public class AgentSessions {
    private static final long TTL = 1800;
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Clock clock;
    private final AgentProperties properties;

    public AgentSessions(Clock clock, AgentProperties properties) {
        this.clock = clock;
        this.properties = properties;
    }

    public synchronized SessionToken create() {
        if (!properties.enabled()) throw new AgentException(HttpStatus.SERVICE_UNAVAILABLE, "Agent 데모가 꺼져 있어요.");
        Instant now = clock.instant();
        sessions.entrySet().removeIf(entry -> !entry.getValue().expiresAt.isAfter(now));
        if (sessions.size() >= 500) throw new AgentException(HttpStatus.TOO_MANY_REQUESTS, "잠시 후 다시 시도해 주세요.");
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.put(token, new Session(now.plusSeconds(TTL)));
        return new SessionToken(token, TTL, true);
    }

    public Session require(String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : "";
        Session session = sessions.get(token);
        if (session == null || !session.expiresAt.isAfter(clock.instant())) {
            throw new AgentException(HttpStatus.UNAUTHORIZED, "대화를 다시 시작해 주세요.");
        }
        return session;
    }

    public void delete(String authorization) {
        require(authorization);
        sessions.remove(authorization.substring(7));
    }

    public static class Session {
        public final Instant expiresAt;
        public String task = "NONE";
        public String recipient;
        public Long amount;
        public boolean practice;
        public int inputErrors;
        public int amountCorrections;
        public String signupStep = "NAME_INPUT";
        public long version;
        public Reply lastReply;
        Session(Instant expiresAt) { this.expiresAt = expiresAt; }
        public void clearDraft() { task = "NONE"; recipient = null; amount = null; }
    }
}
