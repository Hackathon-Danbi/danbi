package com.danbi.domain.agent.service;

import com.danbi.domain.agent.entity.AgentModels.Decision;
import com.danbi.domain.agent.entity.AgentOutcome;
import com.danbi.domain.agent.entity.AgentContext;
import com.danbi.domain.agent.entity.AgentType;
import com.danbi.domain.agent.entity.Screen;
import com.danbi.domain.agent.rag.KnowledgeStore;
import com.danbi.domain.agent.service.AgentSessions.Session;
import com.danbi.domain.agent.tools.BankingTools;
import com.danbi.domain.agent.tools.BankingData.DateRange;
import com.danbi.domain.agent.tools.BankingData.TransferPreviewRequest;
import com.danbi.domain.agent.tools.BankingValidationException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class FinanceAgent implements DanbiAgent {
    private final BankingTools tools;
    private final KnowledgeStore knowledge;
    private final EasyLanguageAgent easy;
    private final Clock clock;
    public FinanceAgent(BankingTools tools, KnowledgeStore knowledge, EasyLanguageAgent easy, Clock clock) {
        this.tools = tools; this.knowledge = knowledge; this.easy = easy; this.clock = clock;
    }

    @Override public AgentType supports() { return AgentType.FINANCE; }

    @Override public AgentOutcome handle(AgentContext context) {
        Decision decision = context.decision();
        String text = context.text();
        Session session = context.session();
        return switch (decision.intent()) {
            case BALANCE -> {
                long balance = tools.getBalance();
                yield new AgentOutcome("finance", "모의 계좌의 잔액은 " + String.format("%,d", balance) + "원이에요.",
                        new Screen.Balance(balance, "KRW"), List.of());
            }
            case TRANSACTIONS -> transactions(decision);
            case PRODUCT -> {
                var answer = easy.grounded("finance", text, Map.of("demo", true), knowledge.search(text, "product"));
                yield new AgentOutcome("finance", answer.text(), new Screen.ProductExplanation(), answer.sources());
            }
            case TRANSFER -> transfer(decision, session);
            default -> AgentOutcome.message("finance", "원하는 금융 업무를 다시 말씀해 주세요.");
        };
    }

    private AgentOutcome transactions(Decision decision) {
        LocalDate now = LocalDate.now(clock);
        try {
            // No date supplied means the current calendar month, explicitly displayed below.
            LocalDate from = decision.startDate() == null ? now.withDayOfMonth(1) : LocalDate.parse(decision.startDate());
            LocalDate to = decision.endDate() == null ? now : LocalDate.parse(decision.endDate());
            if (from.isAfter(to) || from.plusYears(1).isBefore(to) || from.isAfter(now)) {
                return AgentOutcome.message("finance", "오늘까지의 기간을 1년 이내로 지정해 주세요.");
            }
            // A month-wide request can include its future month end; query only elapsed dates.
            if (to.isAfter(now)) to = now;
            var rows = tools.getTransactions(new DateRange(from, to));
            return new AgentOutcome("finance", from + "부터 " + to + "까지 모의 거래내역 " + rows.size() + "건이에요.",
                    new Screen.Transactions(from, to, rows), List.of());
        } catch (DateTimeParseException e) { return AgentOutcome.message("finance", "조회할 시작일과 종료일을 다시 말씀해 주세요."); }
    }

    private AgentOutcome transfer(Decision decision, Session s) {
        s.task = "TRANSFER";
        if (decision.recipient() != null) s.recipient = decision.recipient().strip();
        if (decision.amount() != null) {
            if (s.practice && s.amount != null && !s.amount.equals(decision.amount())) s.amountCorrections++;
            s.amount = decision.amount();
        }
        if (s.recipient == null || s.recipient.isBlank()) return AgentOutcome.message("finance", "누구에게 보낼까요?");
        var recipients = tools.findRecipients(s.recipient);
        if (recipients.size() != 1) {
            if (s.practice) s.inputErrors++;
            return AgentOutcome.message("finance", recipients.isEmpty()
                    ? "등록된 모의 수취인이 없어요. 저장된 수취인의 이름이나 별칭을 확인해 주세요."
                    : "같은 이름이 여러 명이에요. 성과 이름을 모두 말씀해 주세요.");
        }
        if (s.amount == null) return AgentOutcome.message("finance", "얼마를 보낼까요?");
        try {
            var preview = tools.createTransferPreview(new TransferPreviewRequest(recipients.getFirst().id(), s.amount));
            return new AgentOutcome("finance", preview.recipientName() + " 님의 계좌 " + preview.accountMasked() + "로 "
                    + String.format("%,d", preview.amount()) + "원을 보내는 모의 확인 화면이에요. 실제 돈은 보내지 않았어요.",
                    new Screen.TransferConfirmation(preview.recipientId(), preview.recipientName(), preview.accountMasked(),
                            preview.amount(), preview.currency(), s.practice), List.of());
        } catch (BankingValidationException e) {
            if (s.practice) s.inputErrors++;
            return AgentOutcome.message("finance", e.getMessage());
        }
    }
}
