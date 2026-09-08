package com.danbi.transfer.repository;

import com.danbi.transfer.entity.Transfer;
import com.danbi.transfer.entity.TransferStatus;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransferRepository extends JpaRepository<Transfer, Long> {

	long countByAccountIdAndRecipientAccountNumberAndStatus(
		Long accountId, String recipientAccountNumber, TransferStatus status);

	long countByAccountIdAndRecipientAccountNumberAndStatusAndCompletedAtAfter(
		Long accountId, String recipientAccountNumber, TransferStatus status, LocalDateTime after);

	List<Transfer> findTop30ByAccountIdInAndStatusOrderByCompletedAtDesc(
		Collection<Long> accountIds, TransferStatus status);

	Optional<Transfer> findFirstByRecipientBankCodeAndRecipientAccountNumberOrderByRequestedAtDesc(
		String recipientBankCode, String recipientAccountNumber);
}
