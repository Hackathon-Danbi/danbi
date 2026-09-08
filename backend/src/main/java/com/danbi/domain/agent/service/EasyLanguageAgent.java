package com.danbi.domain.agent.service;

import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.llm.Prompts;
import com.danbi.domain.agent.llm.Schemas;
import com.danbi.domain.agent.model.AgentModels.GroundedAnswer;
import com.danbi.domain.agent.model.AgentModels.Source;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class EasyLanguageAgent {
    public record Explanation(String text, List<Source> sources) {}
    private final AiGateway ai;
    private final Prompts prompts;
    public EasyLanguageAgent(AiGateway ai, Prompts prompts) { this.ai = ai; this.prompts = prompts; }

    public Explanation grounded(String role, String question, Object state, List<Source> sources) {
        if (sources.isEmpty()) return unknown();
        GroundedAnswer answer = ai.structured(prompts.load(role) + "\n" + prompts.load("easy-language"),
                Map.of("question", question, "state", state, "sources", sources), Schemas.ANSWER, GroundedAnswer.class);
        if (!answer.supported() || answer.text() == null || answer.text().isBlank() || answer.text().length() > 1800
                || answer.sourceIds() == null || answer.sourceIds().isEmpty()
                || answer.sourceIds().stream().anyMatch(id -> sources.stream().noneMatch(s -> s.id().equals(id)))) {
            return unknown();
        }
        return new Explanation(answer.text(), sources.stream().filter(s -> answer.sourceIds().contains(s.id())).toList());
    }

    private Explanation unknown() {
        return new Explanation("확인할 수 있는 자료가 없어요. 질문을 조금 더 구체적으로 말씀해 주세요.", List.of());
    }
}
