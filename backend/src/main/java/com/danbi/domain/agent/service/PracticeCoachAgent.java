package com.danbi.domain.agent.service;

import com.danbi.domain.agent.model.AgentModels.Source;
import com.danbi.domain.agent.model.AgentOutcome;
import com.danbi.domain.agent.model.AgentContext;
import com.danbi.domain.agent.model.AgentType;
import com.danbi.domain.agent.model.Screen;
import com.danbi.domain.agent.service.AgentSessions.Session;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PracticeCoachAgent implements DanbiAgent {
    private final EasyLanguageAgent easy;
    public PracticeCoachAgent(EasyLanguageAgent easy) { this.easy = easy; }
    @Override public AgentType supports() { return AgentType.PRACTICE; }
    @Override public AgentOutcome handle(AgentContext context) {
        return switch (context.decision().intent()) {
            case PRACTICE -> start(context.session());
            case COACH -> feedback(context.text(), context.session());
            default -> AgentOutcome.message("practice", "연습 시작 또는 연습 피드백을 요청해 주세요.");
        };
    }
    private AgentOutcome start(Session session) {
        session.clearDraft();
        session.practice = true;
        session.task = "TRANSFER";
        return AgentOutcome.message("practice", "모의 송금 연습을 시작할게요. 민수에게 3만 원을 보내는 정보를 입력해 보세요.");
    }
    private AgentOutcome feedback(String question, Session s) {
        String next = s.amountCorrections > 0 ? "AMOUNT_REVIEW" : "RECIPIENT_REVIEW";
        String evidence = "이 세션의 연습 입력 오류 횟수: " + s.inputErrors + ". 금액 수정 횟수: " + s.amountCorrections
                + ". 다음 연습 코드: " + next + ". AMOUNT_REVIEW는 금액 다시 읽기, RECIPIENT_REVIEW는 받는 사람 확인하기이다."
                + " 입력 오류에는 수취인 조회 실패와 금액 범위 오류가 포함되며 원인은 확정할 수 없다.";
        var answer = easy.grounded("coach", question, Map.of("practice", s.practice),
                List.of(new Source("practice-stats", "현재 세션의 모의 연습 기록", "v1", "session://practice", evidence)));
        return new AgentOutcome("practice", answer.text(), new Screen.PracticeFeedback(next, s.inputErrors, s.amountCorrections), answer.sources());
    }
}
