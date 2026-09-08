package com.danbi.domain.savings.repository;

import com.danbi.domain.savings.entity.SavingsContract;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SavingsContractRepository extends JpaRepository<SavingsContract, Long> {
    List<SavingsContract> findByAccountAccountIdIn(Collection<Long> accountIds);
    Optional<SavingsContract> findByAccountAccountId(Long accountId);
}
