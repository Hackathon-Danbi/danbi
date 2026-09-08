package com.danbi.domain.account.repository;

import com.danbi.domain.account.entity.Account;
import com.danbi.domain.account.entity.ProductType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    @EntityGraph(attributePaths = "product")
    List<Account> findByUserIdAndProductProductTypeInOrderByAccountIdAsc(Long userId, Collection<ProductType> types);

    @EntityGraph(attributePaths = "product")
    Optional<Account> findByAccountIdAndUserId(Long accountId, Long userId);

    List<Account> findByUserId(Long userId);
}
