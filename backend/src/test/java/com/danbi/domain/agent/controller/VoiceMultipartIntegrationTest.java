package com.danbi.domain.agent.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.entity.AgentModels.Decision;
import com.danbi.domain.agent.entity.AgentModels.Intent;
import jakarta.servlet.MultipartConfigElement;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.TestPropertySource;
import tools.jackson.databind.json.JsonMapper;

/** Real embedded servlet multipart parsing, which standalone MockMvc multipart requests bypass. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
// Test application.properties shadows the production resource. Load both explicitly, H2 settings last.
@TestPropertySource(locations = {"file:src/main/resources/application.properties", "classpath:application.properties"},
        properties = "danbi.agent.enabled=true")
class VoiceMultipartIntegrationTest {
    @Value("${local.server.port}") private int port;
    @Autowired private MultipartConfigElement config;
    @MockitoBean private AiGateway ai;
    private final HttpClient http = HttpClient.newHttpClient();
    private final JsonMapper json = JsonMapper.builder().build();

    @Test
    @org.springframework.test.context.jdbc.Sql("/agent-banking.sql")
    @org.springframework.test.context.jdbc.Sql(scripts = "/agent-banking-cleanup.sql",
            executionPhase = org.springframework.test.context.jdbc.Sql.ExecutionPhase.AFTER_TEST_METHOD)
    void actualServerAcceptsTwoMiBFileIncludingMultipartOverhead() throws Exception {
        assertEquals(2L * 1024 * 1024, config.getMaxFileSize());
        assertEquals(3L * 1024 * 1024, config.getMaxRequestSize());
        when(ai.transcribe(any(byte[].class), eq("m4a"))).thenReturn("잔액");
        when(ai.structured(anyString(), any(), anyMap(), eq(Decision.class)))
                .thenReturn(new Decision(Intent.BALANCE, null, null, null, null, false));
        var response = upload(2 * 1024 * 1024, 0);
        assertEquals(200, response.statusCode(), response.body());
        assertEquals("balance", json.readTree(response.body()).path("reply").path("screen").path("type").asText());
    }

    @Test
    void actualServerRejectsFileAboveTwoMiBBeforeStt() throws Exception {
        assertSizeError(upload(2 * 1024 * 1024 + 1, 0));
        verifyNoInteractions(ai);
    }

    @Test
    void actualServerRejectsTotalRequestAboveThreeMiB() throws Exception {
        assertSizeError(upload(1, 3 * 1024 * 1024));
        verifyNoInteractions(ai);
    }

    private void assertSizeError(HttpResponse<String> response) {
        assertEquals(413, response.statusCode());
        assertTrue(response.headers().firstValue("Content-Type").orElse("").startsWith("application/json"));
        assertEquals("2MB 이하의 음성 파일을 보내 주세요.", json.readTree(response.body()).path("message").asText());
    }

    private HttpResponse<String> upload(int fileSize, int padding) throws Exception {
        var session = http.send(HttpRequest.newBuilder(uri("/sessions")).POST(HttpRequest.BodyPublishers.noBody()).build(),
                HttpResponse.BodyHandlers.ofString());
        assertEquals(201, session.statusCode());
        String token = json.readTree(session.body()).path("token").asText();
        String boundary = "danbi-test-boundary";
        var body = new ByteArrayOutputStream();
        body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"voice.m4a\""
                + "\r\nContent-Type: audio/mp4\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(new byte[fileSize]);
        if (padding > 0) {
            body.write(("\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"padding\"\r\n\r\n")
                    .getBytes(StandardCharsets.UTF_8));
            body.write(new byte[padding]);
        }
        body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return http.send(HttpRequest.newBuilder(uri("/voice/chat"))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray())).build(), HttpResponse.BodyHandlers.ofString());
    }
    private URI uri(String path) { return URI.create("http://127.0.0.1:" + port + "/api/agents" + path); }
}
