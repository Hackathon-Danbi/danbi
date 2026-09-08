package com.danbi.domain.agent.controller;

import com.danbi.domain.agent.model.AgentException;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice(assignableTypes = AgentController.class)
public class AgentExceptionHandler {
    @ExceptionHandler(AgentException.class)
    public ResponseEntity<Map<String, String>> agent(AgentException error) {
        return ResponseEntity.status(error.status()).contentType(MediaType.APPLICATION_JSON).body(Map.of("message", error.getMessage()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> invalid() {
        return ResponseEntity.badRequest().contentType(MediaType.APPLICATION_JSON).body(Map.of("message", "1~2000자의 질문을 입력해 주세요."));
    }
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> large() {
        return ResponseEntity.status(413).contentType(MediaType.APPLICATION_JSON).body(Map.of("message", "10MB 이하의 음성 파일을 보내 주세요."));
    }
}
