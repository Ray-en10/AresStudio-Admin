package com.ares3dstudio.backend.repository;

import com.ares3dstudio.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Utilisé pour calculer le total du mois (revenu) sur le dashboard
    @Query("SELECT COALESCE(SUM(o.price), 0) FROM Order o WHERE o.status = com.ares3dstudio.backend.model.OrderStatus.COMPLETED AND o.orderDate BETWEEN :start AND :end")
    BigDecimal sumAmountBetween(LocalDate start, LocalDate end);

    @Query("SELECT COALESCE(SUM(o.price), 0) FROM Order o WHERE o.status = com.ares3dstudio.backend.model.OrderStatus.COMPLETED")
    BigDecimal sumCompletedRevenue();

    @Modifying
    @Transactional
    @Query("UPDATE Order o SET o.status = :status WHERE o.id = :id")
    int updateStatusById(@Param("id") Long id, @Param("status") com.ares3dstudio.backend.model.OrderStatus status);

    List<Order> findByStatus(com.ares3dstudio.backend.model.OrderStatus status);
}
