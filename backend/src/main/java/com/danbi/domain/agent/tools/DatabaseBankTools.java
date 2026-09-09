package com.danbi.domain.agent.tools;

import com.danbi.domain.account.entity.Account;
import com.danbi.domain.account.entity.AccountStatus;
import com.danbi.domain.account.repository.AccountRepository;
import com.danbi.domain.transfer.entity.SavedRecipient;
import com.danbi.domain.transfer.repository.SavedRecipientRepository;
import com.danbi.domain.transaction.entity.TransactionType;
import com.danbi.domain.transaction.repository.TransactionRepository;
import com.danbi.domain.agent.entity.AgentException;
import com.danbi.domain.agent.tools.BankingData.*;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Reads the configured user/account from MySQL through the existing repositories. */
@Component
@Transactional(readOnly = true)
public class DatabaseBankTools implements BankingTools {
    private final AccountRepository accounts;
    private final SavedRecipientRepository recipients;
    private final TransactionRepository transactions;
    private final long userId;
    private final long accountId;

    public DatabaseBankTools(AccountRepository accounts, SavedRecipientRepository recipients,
            TransactionRepository transactions,
            @org.springframework.beans.factory.annotation.Value("${danbi.agent.user-id:1}") long userId,
            @org.springframework.beans.factory.annotation.Value("${danbi.agent.account-id:1}") long accountId) {
        this.accounts = accounts;
        this.recipients = recipients;
        this.transactions = transactions;
        this.userId = userId;
        this.accountId = accountId;
    }

    private Account account() {
        return accounts.findByAccountIdAndUserId(accountId, userId)
                .orElseThrow(() -> new AgentException(HttpStatus.SERVICE_UNAVAILABLE, "모의 계좌 데이터를 확인해 주세요."));
    }
    @Override public long getBalance() { return account().getBalance(); }

    @Override public List<RecipientData> findRecipients(String name) {
        if (name == null || name.isBlank()) return List.of();
        return recipients.findMatchingRecipients(account().getUserId(), name.strip()).stream()
                .map(this::recipientData).toList();
    }
    @Override public List<TransactionData> getTransactions(DateRange range) {
        return transactions.findByAccountIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
                account().getAccountId(), range.from().atStartOfDay(), range.to().plusDays(1).atStartOfDay())
                .stream().map(row -> new TransactionData(row.getOccurredAt().toLocalDate(), row.getDescription(),
                        row.getTransactionType() == TransactionType.WITHDRAWAL ? -row.getAmount() : row.getAmount())).toList();
    }
    @Override public TransferPreview createTransferPreview(TransferPreviewRequest request) {
        Account account = account();
        if (account.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BankingValidationException("사용 가능한 모의 계좌인지 확인해 주세요.");
        }
        long id;
        try { id = Long.parseLong(request.recipientId()); }
        catch (NumberFormatException e) { throw new BankingValidationException("받는 분을 다시 확인해 주세요."); }
        RecipientData recipient = recipients.findBySavedRecipientIdAndUserId(id, account.getUserId()).map(this::recipientData)
                .orElseThrow(() -> new BankingValidationException("받는 분을 다시 확인해 주세요."));
        long balance = account.getBalance();
        if (request.amount() <= 0 || request.amount() > balance) {
            throw new BankingValidationException(String.format(Locale.KOREA,
                    "1원부터 모의 잔액 %,d원 이내로 입력해 주세요.", balance));
        }
        return new TransferPreview(recipient.id(), recipient.name(), recipient.accountMasked(), request.amount(), "KRW");
    }
    private RecipientData recipientData(SavedRecipient row) {
        String number = row.getRecipientAccountNumber();
        String masked = number.length() > 4 ? "***" + number.substring(number.length() - 4) : "***";
        return new RecipientData(row.getSavedRecipientId().toString(), row.getRecipientName(), masked);
    }
}
