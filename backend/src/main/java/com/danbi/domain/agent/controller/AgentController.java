package com.danbi.domain.agent.controller;

import com.danbi.domain.agent.model.AgentModels.*;
import com.danbi.domain.agent.service.AgentSessions;
import com.danbi.domain.agent.service.Orchestrator;
import com.danbi.domain.agent.service.VoiceAgent;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/agents")
public class AgentController {
    private final AgentSessions sessions;
    private final Orchestrator orchestrator;
    private final VoiceAgent voice;
    public AgentController(AgentSessions sessions, Orchestrator orchestrator, VoiceAgent voice) {
        this.sessions = sessions; this.orchestrator = orchestrator; this.voice = voice;
    }
    @PostMapping("/sessions")
    public ResponseEntity<SessionToken> create() {
        return ResponseEntity.status(201).cacheControl(CacheControl.noStore()).body(sessions.create());
    }
    @DeleteMapping("/sessions/current")
    public ResponseEntity<Void> delete(@RequestHeader(value = "Authorization", required = false) String token) {
        sessions.delete(token);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/chat")
    public ResponseEntity<Reply> chat(@RequestHeader(value = "Authorization", required = false) String token,
            @Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(orchestrator.chat(sessions.require(token), request.text()));
    }
    @PostMapping(value = "/voice/chat", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VoiceReply> voice(@RequestHeader(value = "Authorization", required = false) String token,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(voice.chat(sessions.require(token), file));
    }
    @PostMapping(value = "/voice/speech", produces = "audio/mpeg")
    public ResponseEntity<byte[]> speech(@RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody SpeechRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(voice.speech(sessions.require(token), request.version()));
    }
}
