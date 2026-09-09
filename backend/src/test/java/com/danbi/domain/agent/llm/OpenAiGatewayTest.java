package com.danbi.domain.agent.llm;

import static org.junit.jupiter.api.Assertions.*;

import com.danbi.domain.agent.AgentTestSupport;
import com.danbi.domain.agent.model.AgentException;
import com.danbi.domain.agent.model.AgentModels.Decision;
import com.danbi.domain.agent.model.AgentModels.Intent;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.json.JsonMapper;

class OpenAiGatewayTest {
    private HttpServer server;
    private OpenAiGateway gateway;
    private int status = 200;
    private String body;
    private String received;
    private String authorization;
    private String contentType;

    @BeforeEach
    void setup() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/", exchange -> {
            received = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            authorization = exchange.getRequestHeaders().getFirst("Authorization");
            contentType = exchange.getRequestHeaders().getFirst("Content-Type");
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        gateway = new OpenAiGateway(AgentTestSupport.properties(), HttpClient.newHttpClient(),
                URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/v1/"));
    }
    @AfterEach void stop() { server.stop(0); }

    @Test
    void responsesUsesStrictSchemaAndParsesOutputContent() {
        var json = JsonMapper.builder().build();
        body = json.writeValueAsString(Map.of("status", "completed", "output", List.of(Map.of(
                "type", "message", "content", List.of(Map.of("type", "output_text", "text",
                        json.writeValueAsString(new Decision(Intent.BALANCE, null, null, null, null, false))))))));
        assertEquals(Intent.BALANCE, gateway.structured("규칙", Map.of("text", "잔액"), Schemas.DECISION, Decision.class).intent());
        var request = json.readTree(received);
        assertFalse(request.path("store").asBoolean());
        assertTrue(request.path("text").path("format").path("strict").asBoolean());
        assertEquals("Bearer fake-test-key", authorization);
    }

    @Test
    void refusalsAndProviderErrorsAreNotReturnedAsSuccessOrLeaked() {
        body = "{\"status\":\"completed\",\"output\":[{\"content\":[{\"type\":\"refusal\"}]}]}";
        assertThrows(AgentException.class, () -> gateway.structured("", Map.of(), Schemas.DECISION, Decision.class));
        status = 429; body = "secret provider error";
        var error = assertThrows(AgentException.class, () -> gateway.embed(List.of("x")));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.status());
        assertFalse(error.getMessage().contains("secret"));
    }

    @Test
    void embeddingsRespectProviderIndicesAndRejectMissingRows() {
        body = "{\"data\":[{\"index\":1,\"embedding\":[0,1]},{\"index\":0,\"embedding\":[1,0]}]}";
        assertEquals(List.of(1.0, 0.0), gateway.embed(List.of("a", "b")).getFirst());
        body = "{\"data\":[]}";
        assertThrows(AgentException.class, () -> gateway.embed(List.of("a")));
    }

    @Test
    void audioUsesMultipartAndSpeechUsesServerText() {
        body = "{\"text\":\"민수 삼만 원\"}";
        assertEquals("민수 삼만 원", gateway.transcribe(new byte[]{1, 2}, "wav"));
        assertTrue(contentType.startsWith("multipart/form-data; boundary="));
        assertTrue(received.contains("filename=\"audio.wav\""));
        body = "fake-audio";
        assertArrayEquals(body.getBytes(StandardCharsets.UTF_8), gateway.speech("모의 안내"));
        assertTrue(received.contains("모의 안내"));
    }
}
