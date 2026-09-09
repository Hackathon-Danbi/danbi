package com.danbi.domain.agent.tools;

import static org.junit.jupiter.api.Assertions.*;

import com.danbi.domain.agent.tools.BankingData.*;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class DemoBankToolsTest {
    private final BankingTools tools = new DemoBankTools(Clock.fixed(Instant.parse("2026-09-08T03:00:00Z"), ZoneId.of("Asia/Seoul")));

    @Test
    void resolvesRecipientsAndValidatesPreviewAtTheToolBoundary() {
        assertEquals(2, tools.findRecipients("영희").size());
        RecipientData recipient = tools.findRecipients("민수").getFirst();
        var preview = tools.createTransferPreview(new TransferPreviewRequest(recipient.id(), 30000));
        assertEquals("김민수", preview.recipientName());
        assertEquals("***1234", preview.accountMasked());
        assertEquals(30000, preview.amount());
        assertEquals(150000, tools.getBalance());
        assertThrows(BankingValidationException.class, () -> tools.createTransferPreview(new TransferPreviewRequest("invented", 100)));
        assertThrows(BankingValidationException.class, () -> tools.createTransferPreview(new TransferPreviewRequest(recipient.id(), 0)));
        assertThrows(BankingValidationException.class, () -> tools.createTransferPreview(new TransferPreviewRequest(recipient.id(), 150001)));
    }

    @Test
    void transactionRangeIsInclusiveAndUsesTypedRows() {
        var rows = tools.getTransactions(new DateRange(LocalDate.of(2026, 9, 7), LocalDate.of(2026, 9, 7)));
        assertEquals(1, rows.size());
        assertEquals(-12000, rows.getFirst().amount());
        assertEquals("연습 마트", rows.getFirst().description());
    }
}
