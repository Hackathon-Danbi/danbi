package com.danbi.domain.agent.llm;

import com.danbi.domain.agent.config.AgentProperties;
import com.danbi.domain.agent.model.AgentException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** OpenAI REST boundary. No raw provider errors, credentials or audio are logged. */
@Component
public class OpenAiGateway implements AiGateway {
    private final AgentProperties properties;
    private final HttpClient http;
    private final URI base;
    private final JsonMapper json = JsonMapper.builder().build();

    @org.springframework.beans.factory.annotation.Autowired
    public OpenAiGateway(AgentProperties properties) {
        this(properties, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(),
                URI.create("https://api.openai.com/v1/"));
    }

    // Package-visible transport injection for local HTTP contract tests.
    OpenAiGateway(AgentProperties properties, HttpClient http, URI base) {
        this.properties = properties;
        this.http = http;
        this.base = base;
    }

    @Override
    public <T> T structured(String prompt, Object input, Map<String, Object> schema, Class<T> type) {
        JsonNode result = postJson("responses", Map.of(
                "model", properties.textModel(), "store", false, "max_output_tokens", 2200,
                "input", List.of(Map.of("role", "system", "content", prompt),
                        Map.of("role", "user", "content", json.writeValueAsString(input))),
                "text", Map.of("format", Map.of("type", "json_schema", "name", type.getSimpleName(),
                        "strict", true, "schema", schema))));
        if (!"completed".equals(result.path("status").asText())) throw unavailable();
        StringBuilder output = new StringBuilder();
        for (JsonNode item : result.path("output")) {
            for (JsonNode part : item.path("content")) {
                if ("refusal".equals(part.path("type").asText())) throw unavailable();
                if ("output_text".equals(part.path("type").asText())) output.append(part.path("text").asText());
            }
        }
        try {
            if (output.isEmpty()) throw unavailable();
            return json.readValue(output.toString(), type);
        } catch (AgentException e) { throw e;
        } catch (RuntimeException e) { throw unavailable(); }
    }

    @Override
    public List<List<Double>> embed(List<String> texts) {
        JsonNode result = postJson("embeddings", Map.of("model", properties.embeddingModel(),
                "input", texts, "encoding_format", "float"));
        List<List<Double>> vectors = new ArrayList<>();
        for (int i = 0; i < texts.size(); i++) vectors.add(null);
        for (JsonNode item : result.path("data")) {
            int index = item.path("index").asInt(-1);
            if (index < 0 || index >= texts.size() || vectors.get(index) != null) throw unavailable();
            List<Double> vector = new ArrayList<>();
            for (JsonNode value : item.path("embedding")) {
                if (!value.isNumber() || !Double.isFinite(value.asDouble())) throw unavailable();
                vector.add(value.asDouble());
            }
            if (vector.isEmpty()) throw unavailable();
            vectors.set(index, List.copyOf(vector));
        }
        if (vectors.stream().anyMatch(v -> v == null)) throw unavailable();
        return List.copyOf(vectors);
    }

    @Override
    public String transcribe(byte[] audio, String extension) {
        String boundary = "danbi-" + UUID.randomUUID();
        try {
            ByteArrayOutputStream body = new ByteArrayOutputStream();
            body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\n"
                    + properties.sttModel() + "\r\n--" + boundary
                    + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"audio." + extension
                    + "\"\r\nContent-Type: application/octet-stream\r\n\r\n").getBytes(StandardCharsets.UTF_8));
            body.write(audio);
            body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
            JsonNode result = parse(send("audio/transcriptions", "multipart/form-data; boundary=" + boundary,
                    body.toByteArray()));
            String text = result.path("text").asText();
            if (text.isBlank() || text.length() > 2000) {
                throw new AgentException(HttpStatus.UNPROCESSABLE_ENTITY, "짧게 다시 말씀해 주세요.");
            }
            return text;
        } catch (IOException e) { throw unavailable(); }
    }

    @Override
    public byte[] speech(String text) {
        return send("audio/speech", "application/json", json.writeValueAsBytes(Map.of(
                "model", properties.ttsModel(), "voice", "coral", "input", text,
                "response_format", "mp3", "instructions", "차분한 한국어로 천천히 정확히 읽으세요.")));
    }

    private JsonNode postJson(String path, Object body) {
        return parse(send(path, "application/json", json.writeValueAsBytes(body)));
    }

    private JsonNode parse(byte[] body) {
        try { return json.readTree(body); }
        catch (RuntimeException e) { throw unavailable(); }
    }

    private byte[] send(String path, String contentType, byte[] body) {
        if (!properties.enabled() || properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new AgentException(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버 설정을 확인해 주세요.");
        }
        HttpRequest request = HttpRequest.newBuilder(base.resolve(path)).timeout(Duration.ofSeconds(40))
                .header("Authorization", "Bearer " + properties.apiKey())
                .header("Content-Type", contentType).POST(HttpRequest.BodyPublishers.ofByteArray(body)).build();
        try {
            HttpResponse<byte[]> response = http.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() == 429) {
                throw new AgentException(HttpStatus.SERVICE_UNAVAILABLE, "요청이 많아요. 잠시 후 다시 시도해 주세요.");
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) throw unavailable();
            return response.body();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw unavailable();
        } catch (IOException e) { throw unavailable(); }
    }

    private AgentException unavailable() {
        return new AgentException(HttpStatus.BAD_GATEWAY, "AI 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
}
