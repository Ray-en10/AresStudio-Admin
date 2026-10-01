package com.ares3dstudio.backend.controller;

import com.ares3dstudio.backend.model.Order;
import com.ares3dstudio.backend.model.OrderStatus;
import com.ares3dstudio.backend.repository.OrderRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // GET /api/orders -> liste toutes les commandes (les plus récentes en premier)
    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
    }

    // GET /api/orders/id
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/orders/status/{status} -> filtrer par statut
    @GetMapping("/status/{status}")
    public List<Order> getByStatus(@PathVariable OrderStatus status) {
        return orderRepository.findByStatus(status);
    }

    // GET /api/orders/next-order-id -> pré-remplir le champ "Order ID" du formulaire Add order
    @GetMapping("/next-order-id")
    public Map<String, String> getNextOrderId() {
        long nextId = orderRepository.count() + 1001;
        return Map.of("orderId", "ORD-" + nextId);
    }

    // POST /api/orders -> créer une commande (formulaire "Add order")
    @PostMapping
    public ResponseEntity<Order> createOrder(@Valid @RequestBody Order order) {
        if (order.getStatus() == null) {
            order.setStatus(OrderStatus.PENDING);
        }
        if (order.getOrderLink() == null && !order.getItems().isEmpty()) {
            order.setOrderLink(order.getItems().get(0).getModelUrl());
        }
        Order saved = orderRepository.save(order);
        // Génère l'ID lisible une fois l'id technique connu (ex: ORD-1045)
        saved.setOrderId("ORD-" + (1000 + saved.getId()));
        saved = orderRepository.save(saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // PUT /api/orders/{id} -> modifier une commande (ex: changer le statut depuis la modale "View")
    @PutMapping("/{id}")
    public ResponseEntity<Order> updateOrder(@PathVariable Long id, @Valid @RequestBody Order updated) {
        return orderRepository.findById(id)
                .map(existing -> {
                    existing.setName(updated.getName());
                    existing.setLastName(updated.getLastName());
                    existing.setPhone(updated.getPhone());
                    existing.setAddress(updated.getAddress());
                    existing.setOrderDate(updated.getOrderDate());
                        existing.setItems(updated.getItems());
                        existing.setOrderLink(updated.getOrderLink() == null && !updated.getItems().isEmpty()
                            ? updated.getItems().get(0).getModelUrl()
                            : updated.getOrderLink());
                    existing.setDescription(updated.getDescription());
                        existing.setImageData(updated.getImageData());
                    existing.setPrice(updated.getPrice());
                    existing.setStatus(updated.getStatus());
                    return ResponseEntity.ok(orderRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/orders/id
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        if (!orderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        orderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/orders/stats/monthly-revenue -> total du mois en cours (pour le dashboard)
    @GetMapping("/stats/monthly-revenue")
    public Map<String, Object> getMonthlyRevenue() {
        YearMonth currentMonth = YearMonth.now();
        LocalDate start = currentMonth.atDay(1);
        LocalDate end = currentMonth.atEndOfMonth();
        BigDecimal total = orderRepository.sumAmountBetween(start, end);
        return Map.of(
                "month", currentMonth.toString(),
                "totalRevenue", total
        );
    }
}
