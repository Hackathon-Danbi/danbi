package com.danbi.domain.agent.rag;

import com.danbi.domain.agent.config.AgentProperties;
import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.model.AgentModels.Source;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/** Trusted bundled demo documents only. Lazy immutable index; no user-controlled ingestion. */
@Component
public class KnowledgeStore {
    public record Document(String id, String domain, String title, String version, String reference, String text) {}
    private record Chunk(String domain, Source source, List<Double> vector) {}
    private record Scored(Chunk chunk, double score) {}
    private final AiGateway ai;
    private final AgentProperties properties;
    private volatile List<Chunk> index;

    public KnowledgeStore(AiGateway ai, AgentProperties properties) {
        this.ai = ai;
        this.properties = properties;
    }

    public List<Source> search(String question, String domain) {
        List<Chunk> current = index();
        List<Double> query = ai.embed(List.of(question)).getFirst();
        return current.stream().filter(chunk -> chunk.domain().equals(domain))
                .map(chunk -> new Scored(chunk, cosine(query, chunk.vector())))
                .filter(item -> item.score() >= properties.ragMinScore())
                .sorted(Comparator.comparingDouble(Scored::score).reversed()).limit(3)
                .map(item -> item.chunk().source()).toList();
    }

    private synchronized List<Chunk> index() {
        if (index != null) return index;
        try (var input = new ClassPathResource("agent/knowledge/demo.json").getInputStream()) {
            Document[] docs = JsonMapper.builder().build().readValue(input, Document[].class);
            List<Source> sources = new ArrayList<>();
            List<String> domains = new ArrayList<>();
            for (Document doc : docs) {
                List<String> chunks = split(doc.text());
                for (int i = 0; i < chunks.size(); i++) {
                    sources.add(new Source(doc.id() + ":" + i, doc.title(), doc.version(), doc.reference(), chunks.get(i)));
                    domains.add(doc.domain());
                }
            }
            List<List<Double>> vectors = ai.embed(sources.stream().map(s -> s.title() + "\n" + s.excerpt()).toList());
            if (vectors.size() != sources.size()) throw new IllegalStateException("Incomplete embedding batch");
            List<Chunk> built = new ArrayList<>();
            for (int i = 0; i < sources.size(); i++) built.add(new Chunk(domains.get(i), sources.get(i), vectors.get(i)));
            index = List.copyOf(built); // Publish only after the complete batch succeeds.
            return index;
        } catch (IOException e) { throw new IllegalStateException("Cannot read bundled knowledge", e); }
    }

    static List<String> split(String text) {
        List<String> result = new ArrayList<>();
        // Short clauses remain whole; long paragraphs have 80-character overlap.
        for (String paragraph : text.split("\\n\\s*\\n")) {
            String value = paragraph.strip();
            if (value.isEmpty()) continue;
            for (int start = 0; start < value.length(); start += 520) {
                int end = Math.min(start + 600, value.length());
                result.add(value.substring(start, end));
                if (end == value.length()) break;
            }
        }
        return result;
    }

    static double cosine(List<Double> a, List<Double> b) {
        if (a.size() != b.size() || a.isEmpty()) throw new IllegalStateException("Embedding dimension mismatch");
        double dot = 0, aa = 0, bb = 0;
        for (int i = 0; i < a.size(); i++) { dot += a.get(i) * b.get(i); aa += a.get(i) * a.get(i); bb += b.get(i) * b.get(i); }
        return aa == 0 || bb == 0 ? 0 : dot / Math.sqrt(aa * bb);
    }
}
