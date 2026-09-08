package com.danbi.domain.account.repository;

import com.danbi.domain.account.entity.Account;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {

	List<Account> findByUserId(Long userId);
}
