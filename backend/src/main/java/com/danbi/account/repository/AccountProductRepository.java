package com.danbi.account.repository;

import com.danbi.account.entity.AccountProduct;
import com.danbi.account.entity.ProductType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountProductRepository extends JpaRepository<AccountProduct, Long> {

	List<AccountProduct> findByProductType(ProductType productType);

	Optional<AccountProduct> findFirstByProductType(ProductType productType);
}
