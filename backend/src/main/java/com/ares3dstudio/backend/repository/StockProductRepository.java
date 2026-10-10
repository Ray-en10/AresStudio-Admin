package com.ares3dstudio.backend.repository;

import com.ares3dstudio.backend.model.StockProduct;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockProductRepository extends JpaRepository<StockProduct, Long> {}
