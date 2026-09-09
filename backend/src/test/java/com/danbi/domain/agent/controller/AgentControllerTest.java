package com.danbi.domain.agent.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.danbi.domain.agent.AgentTestSupport;
import com.danbi.domain.agent.config.AgentProperties;
import com.danbi.domain.agent.entity.AgentException;
import com.danbi.domain.agent.llm.AiGateway;
import com.danbi.domain.agent.llm.Prompts;
import com.danbi.domain.agent.entity.AgentModels.*;
import com.danbi.domain.agent.rag.KnowledgeStore;
import com.danbi.domain.agent.service.*;
import com.danbi.domain.agent.tools.DatabaseBankTools;
import java.time.Clock;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.json.JsonMapper;

@org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
@org.springframework.context.annotation.Import(DatabaseBankTools.class)
@org.springframework.test.context.jdbc.Sql("/agent-banking.sql")
class AgentControllerTest {
    @org.springframework.beans.factory.annotation.Autowired private DatabaseBankTools tools;
    private final AiGateway ai = mock(AiGateway.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        Clock clock = Clock.systemUTC();
        var sessions = new AgentSessions(clock, AgentTestSupport.properties());
        var knowledge = mock(KnowledgeStore.class);
        var easy = new EasyLanguageAgent(ai, new Prompts());
        var app = new Orchestrator(ai, new Prompts(), List.of(new FinanceAgent(tools, knowledge, easy, clock),
                new SignupAgent(knowledge, easy), new PracticeCoachAgent(easy)), clock);
        mvc = MockMvcBuilders.standaloneSetup(new AgentController(sessions, app, new VoiceAgent(ai, app)))
                .setControllerAdvice(new AgentExceptionHandler()).build();
    }

    private String token() throws Exception {
        String body = mvc.perform(post("/api/agents/sessions")).andExpect(status().isCreated())
                .andExpect(header().string("Cache-Control", "no-store")).andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonMapper.builder().build().readTree(body).path("token").asText();
    }

    @Test
    void tokenChatAndSpeechShareTheSameFinalMessage() throws Exception {
        when(ai.structured(anyString(), any(), anyMap(), eq(Decision.class)))
                .thenReturn(new Decision(Intent.BALANCE, null, null, null, null, false));
        when(ai.speech(anyString())).thenReturn(new byte[]{1, 2, 3});
        String token = token();
        mvc.perform(post("/api/agents/chat").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"잔액\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.demo").value(true))
                .andExpect(jsonPath("$.screen.balance").value(150000)).andExpect(jsonPath("$.version").value(1));
        mvc.perform(post("/api/agents/voice/speech").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"version\":1}"))
                .andExpect(status().isOk()).andExpect(content().contentType("audio/mpeg"))
                .andExpect(content().bytes(new byte[]{1, 2, 3}));
        verify(ai).speech("모의 계좌의 잔액은 150,000원이에요.");
    }

    @Test
    void missingAndRevokedTokensCannotAccessChatOrSpeech() throws Exception {
        mvc.perform(post("/api/agents/voice/speech").accept("audio/mpeg").contentType(MediaType.APPLICATION_JSON)
                .content("{\"version\":1}"))
                .andExpect(status().isUnauthorized()).andExpect(content().contentType(MediaType.APPLICATION_JSON));
        String token = token();
        mvc.perform(delete("/api/agents/sessions/current").header("Authorization", token)).andExpect(status().isNoContent());
        mvc.perform(post("/api/agents/chat").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"잔액\"}")).andExpect(status().isUnauthorized());
        verifyNoInteractions(ai);
    }

    @Test
    void emptyTextNeverCallsAi() throws Exception {
        mvc.perform(post("/api/agents/chat").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"  \"}")).andExpect(status().isBadRequest());
        verifyNoInteractions(ai);
    }

    @Test
    void demoIsDisabledByDefault() {
        var disabled = new AgentProperties(false, "", "", "", "", "", 0.35);
        assertThrows(AgentException.class,
                () -> new AgentSessions(Clock.systemUTC(), disabled).create());
    }
}
