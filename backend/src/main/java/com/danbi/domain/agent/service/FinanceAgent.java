package com.danbi.domain.agent.service;

import com.danbi.domain.agent.model.AgentModels.Decision;
import com.danbi.domain.agent.model.AgentOutcome;
import com.danbi.domain.agent.rag.KnowledgeStore;
import com.danbi.domain.agent.service.AgentSessions.Session;
import com.danbi.domain.agent.tools.DemoBankTools;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class FinanceAgent {
    private final DemoBankTools tools;
    private final KnowledgeStore knowledge;
    private final EasyLanguageAgent easy;
    private final Clock clock;
    public FinanceAgent(DemoBankTools tools, KnowledgeStore knowledge, EasyLanguageAgent easy, Clock clock) {
        this.tools = tools; this.knowledge = knowledge; this.easy = easy; this.clock = clock;
    }

    public AgentOutcome run(Decision decision, String text, Session session) {
        return switch (decision.intent()) {
            case BALANCE -> new AgentOutcome("finance", "모의 계좌의 잔액은 " + String.format("%,d", tools.balance()) + "원이에요.",
                    Map.of("type", "balance", "balance", tools.balance(), "currency", "KRW"), List.of());
            case TRANSACTIONS -> transactions(decision);
            case PRODUCT -> {
                var answer = easy.grounded("finance", text, Map.of("demo", true), knowledge.search(text, "product"));
                yield new AgentOutcome("finance", answer.text(), Map.of("type", "product_explanation"), answer.sources());
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
            if (from.isAfter(to) || from.plusYears(1).isBefore(to) || to.isAfter(now)) {
                return AgentOutcome.message("finance", "오늘까지의 기간을 1년 이내로 지정해 주세요.");
            }
            var rows = tools.transactions(from, to);
            return new AgentOutcome("finance", from + "부터 " + to + "까지 모의 거래내역 " + rows.size() + "건이에요.",
                    Map.of("type", "transactions", "from", from.toString(), "to", to.toString(), "items", rows), List.of());
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
        var recipients = tools.recipients(s.recipient);
        if (recipients.size() != 1) {
            if (s.practice) s.inputErrors++;
            return AgentOutcome.message("finance", recipients.isEmpty()
                    ? "등록된 모의 수취인이 없어요. 민수 또는 지영으로 연습해 주세요."
                    : "같은 이름이 여러 명이에요. 박영희 또는 김영희처럼 성과 이름을 말씀해 주세요.");
        }
        if (s.amount == null) return AgentOutcome.message("finance", "얼마를 보낼까요?");
        if (s.amount <= 0 || s.amount > tools.balance()) {
            if (s.practice) s.inputErrors++;
            return AgentOutcome.message("finance", "1원부터 모의 잔액 150,000원 이내로 입력해 주세요.");
        }
        var recipient = recipients.getFirst();
        return new AgentOutcome("finance", recipient.get("name") + " 님의 계좌 " + recipient.get("account") + "로 "
                + String.format("%,d", s.amount) + "원을 보내는 모의 확인 화면이에요. 실제 돈은 보내지 않았어요.",
                Map.of("type", "transfer_confirmation", "recipientId", recipient.get("id"),
                        "recipientName", recipient.get("name"), "accountMasked", recipient.get("account"),
                        "amount", s.amount, "currency", "KRW", "practice", s.practice), List.of());
    }
}
