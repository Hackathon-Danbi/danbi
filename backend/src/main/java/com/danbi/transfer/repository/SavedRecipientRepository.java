package com.danbi.transfer.repository;

import com.danbi.transfer.entity.SavedRecipient;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedRecipientRepository extends JpaRepository<SavedRecipient, Long> {

	List<SavedRecipient> findByUserIdOrderBySavedRecipientIdDesc(Long userId);

	Optional<SavedRecipient> findFirstByRecipientBankCodeAndRecipientAccountNumber(
		String recipientBankCode, String recipientAccountNumber);

	Optional<SavedRecipient> findFirstByUserIdAndRecipientBankCodeAndRecipientAccountNumber(
		Long userId, String recipientBankCode, String recipientAccountNumber);
}
