package com.danbi.domain.agent.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.llm.Prompts;
import com.danbi.domain.agent.entity.AgentModels.*;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class GroundedAnswerTest {
    @Test
    void rejectsInventedSourceIdsAndPreservesVerifiedSourceMetadata() {
        AiGateway ai = mock(AiGateway.class);
        var easy = new EasyLanguageAgent(ai, new Prompts());
        Source source = new Source("terms:0", "약관", "v3", "demo://terms", "선택 동의는 선택할 수 있다.");
        when(ai.structured(anyString(), any(), anyMap(), eq(GroundedAnswer.class)))
                .thenReturn(new GroundedAnswer(true, "조작된 답변", List.of("unknown")),
                        new GroundedAnswer(true, "선택 동의는 선택할 수 있어요.", List.of("terms:0")));
        assertTrue(easy.grounded("signup", "선택 동의?", Map.of(), List.of(source)).sources().isEmpty());
        var answer = easy.grounded("signup", "선택 동의?", Map.of(), List.of(source));
        assertEquals(List.of(source), answer.sources());
        assertEquals("v3", answer.sources().getFirst().version());
    }
}
