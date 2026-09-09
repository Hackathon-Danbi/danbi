package com.danbi.domain.agent.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.danbi.domain.agent.AgentTestSupport;
import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.model.AgentException;
import com.danbi.domain.agent.model.AgentModels.Reply;
import com.danbi.domain.agent.model.Screen;
import java.time.Clock;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

class VoiceUploadTest {
    private final AiGateway ai = mock(AiGateway.class);
    private final Orchestrator orchestrator = mock(Orchestrator.class);
    private final VoiceAgent voice = new VoiceAgent(ai, orchestrator);
    private AgentSessions.Session session() {
        var sessions = new AgentSessions(Clock.systemUTC(), AgentTestSupport.properties());
        return sessions.require("Bearer " + sessions.create().token());
    }

    @Test
    void exactlyTwoMiBIsAcceptedAndTranscribed() {
        var session = session();
        var reply = new Reply(1, "finance", "잔액", new Screen.Balance(150000, "KRW"), List.of(), true);
        when(ai.transcribe(any(byte[].class), eq("m4a"))).thenReturn("잔액");
        when(orchestrator.chat(session, "잔액")).thenReturn(reply);
        var result = voice.chat(session, new MockMultipartFile("file", "voice.m4a", "audio/mp4", new byte[2 * 1024 * 1024]));
        assertEquals(reply, result.reply());
        verify(ai).transcribe(argThat(bytes -> bytes.length == 2 * 1024 * 1024), eq("m4a"));
    }

    @Test
    void oneByteOverLimitNeverCallsAi() {
        var error = assertThrows(AgentException.class, () -> voice.chat(session(),
                new MockMultipartFile("file", "voice.wav", "audio/wav", new byte[2 * 1024 * 1024 + 1])));
        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, error.status());
        assertEquals("2MB 이하의 음성 파일을 보내 주세요.", error.getMessage());
        verifyNoInteractions(ai, orchestrator);
    }

    @Test
    void emptyFileHasItsOwnBadRequestMessage() {
        var error = assertThrows(AgentException.class, () -> voice.chat(session(),
                new MockMultipartFile("file", "voice.wav", "audio/wav", new byte[0])));
        assertEquals(HttpStatus.BAD_REQUEST, error.status());
        assertEquals("녹음된 음성 파일을 보내 주세요.", error.getMessage());
        verifyNoInteractions(ai, orchestrator);
    }
}
