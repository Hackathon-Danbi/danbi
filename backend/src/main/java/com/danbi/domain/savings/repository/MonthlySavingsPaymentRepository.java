package com.danbi.domain.savings.repository;

import com.danbi.domain.savings.entity.MonthlySavingsPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MonthlySavingsPaymentRepository extends JpaRepository<MonthlySavingsPayment, Long> {
    List<MonthlySavingsPayment> findByContractContractIdInAndPaymentMonth(Collection<Long> contractIds, String paymentMonth);
    Optional<MonthlySavingsPayment> findByContractContractIdAndPaymentMonth(Long contractId, String paymentMonth);
}
