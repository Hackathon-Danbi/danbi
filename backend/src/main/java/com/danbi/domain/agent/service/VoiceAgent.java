package com.danbi.domain.agent.service;

import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.model.AgentException;
import com.danbi.domain.agent.model.AgentModels.VoiceReply;
import com.danbi.domain.agent.service.AgentSessions.Session;
import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VoiceAgent {
    private final AiGateway ai;
    private final Orchestrator orchestrator;
    public VoiceAgent(AiGateway ai, Orchestrator orchestrator) { this.ai = ai; this.orchestrator = orchestrator; }
    public VoiceReply chat(Session session, MultipartFile file) {
        if (file.isEmpty() || file.getSize() > 10 * 1024 * 1024) {
            throw new AgentException(HttpStatus.PAYLOAD_TOO_LARGE, "10MB 이하의 음성 파일을 보내 주세요.");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String extension = name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        if (!Set.of("wav", "mp3", "m4a", "webm", "mp4", "mpeg", "mpga").contains(extension)) {
            throw new AgentException(HttpStatus.BAD_REQUEST, "지원하는 음성 파일 형식을 사용해 주세요.");
        }
        // Lock across STT and routing: later text requests cannot overtake an earlier audio turn.
        synchronized (session) {
            try {
                String text = ai.transcribe(file.getBytes(), extension);
                return new VoiceReply(text, orchestrator.chat(session, text));
            } catch (IOException e) { throw new AgentException(HttpStatus.BAD_REQUEST, "음성 파일을 읽지 못했어요."); }
        }
    }

    public byte[] speech(Session session, long version) {
        synchronized (session) {
            if (session.lastReply == null || session.version != version) {
                throw new AgentException(HttpStatus.CONFLICT, "최신 안내를 다시 요청해 주세요.");
            }
            // Only server-generated final text can be spoken; arbitrary client text is not accepted.
            return ai.speech(session.lastReply.text());
        }
    }
}
