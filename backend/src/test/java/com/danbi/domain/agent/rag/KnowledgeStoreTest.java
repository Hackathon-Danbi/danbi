package com.danbi.domain.agent.rag;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.danbi.domain.agent.AgentTestSupport;
import com.danbi.domain.agent.llm.AiGateway;
import java.util.List;
import org.junit.jupiter.api.Test;

class KnowledgeStoreTest {
    @Test
    void buildsIndexOnceFiltersDomainAndReturnsVersionedSources() {
        AiGateway ai = mock(AiGateway.class);
        when(ai.embed(anyList())).thenAnswer(call -> {
            List<String> texts = call.getArgument(0);
            return texts.stream().map(text -> List.of(1.0, 0.0)).toList();
        });
        var store = new KnowledgeStore(ai, AgentTestSupport.properties());
        var sources = store.search("적금", "product");
        assertEquals(2, sources.size());
        assertTrue(sources.stream().allMatch(s -> s.id().startsWith("product-") && s.version().equals("demo-v1")));
        store.search("약관", "signup");
        verify(ai, times(1)).embed(argThat(texts -> texts.size() == 5));
    }

    @Test
    void lowSimilarityReturnsNoEvidence() {
        AiGateway ai = mock(AiGateway.class);
        when(ai.embed(anyList())).thenAnswer(call -> {
            List<String> texts = call.getArgument(0);
            return texts.stream().map(text -> texts.size() == 1 ? List.of(0.0, 1.0) : List.of(1.0, 0.0)).toList();
        });
        assertTrue(new KnowledgeStore(ai, AgentTestSupport.properties()).search("무관한 질문", "product").isEmpty());
    }

    @Test
    void longChunksHaveOverlapAndDimensionMismatchIsRejected() {
        var chunks = KnowledgeStore.split("가".repeat(800));
        assertEquals(2, chunks.size());
        assertEquals(600, chunks.getFirst().length());
        assertEquals(280, chunks.getLast().length());
        assertThrows(IllegalStateException.class, () -> KnowledgeStore.cosine(List.of(1.0), List.of(1.0, 0.0)));
    }
}
