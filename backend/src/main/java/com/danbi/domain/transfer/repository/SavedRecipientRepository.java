package com.danbi.domain.transfer.repository;

import com.danbi.domain.transfer.entity.SavedRecipient;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedRecipientRepository extends JpaRepository<SavedRecipient, Long> {
    Optional<SavedRecipient> findBySavedRecipientIdAndUserId(Long id, Long userId);

    @org.springframework.data.jpa.repository.Query("""
        select r from SavedRecipient r where r.userId = :userId
        and (r.recipientName = :name or r.nickname = :name)
        order by r.savedRecipientId
        """)
    List<SavedRecipient> findMatchingRecipients(@org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("name") String name);


	List<SavedRecipient> findByUserIdOrderBySavedRecipientIdDesc(Long userId);

	Optional<SavedRecipient> findFirstByRecipientBankCodeAndRecipientAccountNumber(
		String recipientBankCode, String recipientAccountNumber);

	Optional<SavedRecipient> findFirstByUserIdAndRecipientBankCodeAndRecipientAccountNumber(
		Long userId, String recipientBankCode, String recipientAccountNumber);
}
