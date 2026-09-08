package com.danbi.domain.agent.tools;

import com.danbi.domain.agent.tools.BankingData.*;
import java.util.List;

/** Implementations must be bound to a server-verified user/account context before real banking use. */
public interface BankingTools {
    long getBalance();
    List<TransactionData> getTransactions(DateRange range);
    List<RecipientData> findRecipients(String name);
    /** Validate authoritative recipient and amount; never execute a transfer. */
    TransferPreview createTransferPreview(TransferPreviewRequest request);
}
