package com.ares3dstudio.backend.repository;

import com.ares3dstudio.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Utilisé pour calculer le total du mois (revenu) sur le dashboard
    @Query("SELECT COALESCE(SUM(o.price), 0) FROM Order o WHERE o.orderDate BETWEEN :start AND :end")
    BigDecimal sumAmountBetween(LocalDate start, LocalDate end);

    List<Order> findByStatus(com.ares3dstudio.backend.model.OrderStatus status);
}
