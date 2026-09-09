package com.danbi.domain.agent.tools;

import com.danbi.domain.agent.tools.BankingData.*;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Component;

/** Deliberately has no reference to TransferService or customer repositories. */
@Component
public class DemoBankTools implements BankingTools {
    private record SavedRecipient(RecipientData data, String alias) {}
    private static final List<SavedRecipient> RECIPIENTS = List.of(
            new SavedRecipient(new RecipientData("r1", "김민수", "***1234"), "민수"),
            new SavedRecipient(new RecipientData("r2", "이지영", "***5678"), "지영"),
            new SavedRecipient(new RecipientData("r3", "박영희", "***1111"), "영희"),
            new SavedRecipient(new RecipientData("r4", "김영희", "***2222"), "영희"));
    private final Clock clock;
    public DemoBankTools(Clock clock) { this.clock = clock; }
    @Override public long getBalance() { return 150_000; }
    @Override public List<RecipientData> findRecipients(String name) {
        return RECIPIENTS.stream().filter(r -> r.data().name().equals(name) || r.alias().equals(name))
                .map(SavedRecipient::data).toList();
    }
    @Override public List<TransactionData> getTransactions(DateRange range) {
        LocalDate today = LocalDate.now(clock);
        return List.of(new TransactionData(today.minusDays(1), "연습 마트", -12000),
                new TransactionData(today.minusDays(3), "연습 입금", 50000))
                .stream().filter(row -> !row.date().isBefore(range.from()) && !row.date().isAfter(range.to())).toList();
    }
    @Override public TransferPreview createTransferPreview(TransferPreviewRequest request) {
        RecipientData recipient = RECIPIENTS.stream().map(SavedRecipient::data)
                .filter(r -> r.id().equals(request.recipientId())).findFirst()
                .orElseThrow(() -> new BankingValidationException("받는 분을 다시 확인해 주세요."));
        if (request.amount() <= 0 || request.amount() > getBalance()) {
            throw new BankingValidationException("1원부터 모의 잔액 150,000원 이내로 입력해 주세요.");
        }
        return new TransferPreview(recipient.id(), recipient.name(), recipient.accountMasked(), request.amount(), "KRW");
    }
}
