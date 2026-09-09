package com.danbi.domain.agent.service;

import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.entity.AgentException;
import com.danbi.domain.agent.entity.AgentModels.VoiceReply;
import com.danbi.domain.agent.entity.Screen;
import com.danbi.domain.agent.service.AgentSessions.Session;
import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VoiceAgent {
    private static final long MAX_AUDIO_BYTES = 2L * 1024 * 1024;
    private final AiGateway ai;
    private final Orchestrator orchestrator;
    public VoiceAgent(AiGateway ai, Orchestrator orchestrator) { this.ai = ai; this.orchestrator = orchestrator; }
    public VoiceReply chat(Session session, MultipartFile file) {
        if (file.isEmpty()) {
            throw new AgentException(HttpStatus.BAD_REQUEST, "녹음된 음성 파일을 보내 주세요.");
        }
        if (file.getSize() > MAX_AUDIO_BYTES) {
            throw new AgentException(HttpStatus.PAYLOAD_TOO_LARGE, "2MB 이하의 음성 파일을 보내 주세요.");
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
            String text = session.lastReply.text();
            if (session.lastReply.screen() instanceof Screen.TransferConfirmation transfer) {
                text = transferSpeech(transfer);
            }
            return ai.speech(text);
        }
    }

    private String transferSpeech(Screen.TransferConfirmation transfer) {
        String masked = transfer.accountMasked();
        String ending = masked.length() >= 4 ? masked.substring(masked.length() - 4) : "";
        String accountNotice = "계좌번호 일부는 표시하지 않아요. ";
        if (ending.matches("[0-9]{4}")) {
            String[] digits = {"공", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"};
            String spoken = ending.chars().mapToObj(c -> digits[c - '0'])
                    .collect(java.util.stream.Collectors.joining(", "));
            accountNotice = "계좌번호 끝 네 자리는 " + spoken + "입니다. ";
        }
        return transfer.recipientName() + " 님에게 " + String.format(Locale.KOREA, "%,d", transfer.amount())
                + "원을 보내는 모의 확인 화면이에요. " + accountNotice + "실제 돈은 보내지 않았어요.";
    }

}
