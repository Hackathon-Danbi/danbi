package com.danbi.domain.agent.model;

import static org.junit.jupiter.api.Assertions.*;

import com.danbi.domain.agent.model.AgentModels.Reply;
import com.danbi.domain.agent.tools.BankingData.TransactionData;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class ScreenContractTest {
    private final JsonMapper json = JsonMapper.builder().build();

    @Test
    void allSevenScreenTypesPreserveTheirExactWireFields() {
        LocalDate date = LocalDate.of(2026, 9, 8);
        assertScreen(new Screen.Message(), """
                {"type":"message"}
                """);
        assertScreen(new Screen.Balance(150000, "KRW"), """
                {"type":"balance","balance":150000,"currency":"KRW"}
                """);
        assertScreen(new Screen.Transactions(date, date, List.of(new TransactionData(date, "연습 마트", -12000))), """
                {"type":"transactions","from":"2026-09-08","to":"2026-09-08",
                 "items":[{"date":"2026-09-08","description":"연습 마트","amount":-12000}]}
                """);
        assertScreen(new Screen.TransferConfirmation("r1", "김민수", "***1234", 30000, "KRW", true), """
                {"type":"transfer_confirmation","recipientId":"r1","recipientName":"김민수",
                 "accountMasked":"***1234","amount":30000,"currency":"KRW","practice":true}
                """);
        assertScreen(new Screen.ProductExplanation(), """
                {"type":"product_explanation"}
                """);
        assertScreen(new Screen.SignupGuide("NAME_INPUT"), """
                {"type":"signup_guide","step":"NAME_INPUT"}
                """);
        assertScreen(new Screen.PracticeFeedback("AMOUNT_REVIEW", 2, 1), """
                {"type":"practice_feedback","nextScenario":"AMOUNT_REVIEW","inputErrors":2,"amountCorrections":1}
                """);
    }

    private void assertScreen(Screen screen, String expected) {
        // Serialize inside Reply too: this exercises the declared interface field, not only concrete records.
        var reply = new Reply(1, "finance", "안내", screen, List.of(), true);
        var actual = json.readTree(json.writeValueAsString(reply));
        assertEquals(json.readTree(expected), actual.path("screen"));
        assertEquals("안내", actual.path("text").asText());
    }
}
