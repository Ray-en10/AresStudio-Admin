package com.ares3dstudio.backend.controller;

import com.ares3dstudio.backend.model.*;
import com.ares3dstudio.backend.repository.FinanceEntryRepository;
import com.ares3dstudio.backend.repository.FinanceTotalsRepository;
import com.ares3dstudio.backend.repository.OrderRepository;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {
    private final FinanceEntryRepository repository;
    private final FinanceTotalsRepository totalsRepository;
    private final OrderRepository orderRepository;
    public FinanceController(FinanceEntryRepository repository, FinanceTotalsRepository totalsRepository, OrderRepository orderRepository) {
        this.repository = repository;
        this.totalsRepository = totalsRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<FinanceEntry> getAll() {
        return repository.findAll().stream()
                .sorted((a, b) -> b.getEntryDate().compareTo(a.getEntryDate())).toList();
    }

    @GetMapping("/summary")
    public Map<String, BigDecimal> summary() {
        FinanceTotals totals = totalsRepository.findById(1L).orElseGet(() -> {
            FinanceTotals created = new FinanceTotals();
            created.setIncome(repository.findAll().stream().filter(e -> e.getType() == FinanceType.INCOME).map(FinanceEntry::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            created.setExpenses(repository.findAll().stream().filter(e -> e.getType() == FinanceType.EXPENSE).map(FinanceEntry::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            created.setBalance(created.getIncome().add(orderRepository.sumCompletedRevenue()).subtract(created.getExpenses()));
            return totalsRepository.save(created);
        });
        return summaryMap(totals, orderRepository.sumCompletedRevenue());
    }

    @GetMapping("/growth")
    public List<Map<String, Object>> growth() {
        Map<LocalDate, BigDecimal[]> daily = new TreeMap<>();
        repository.findAll().forEach(entry -> {
            BigDecimal[] values = daily.computeIfAbsent(entry.getEntryDate(), ignored -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            if (entry.getType() == FinanceType.INCOME) values[0] = values[0].add(entry.getAmount());
            else values[1] = values[1].add(entry.getAmount());
        });
        orderRepository.findAll().stream()
                .filter(order -> order.getStatus() == OrderStatus.COMPLETED)
                .forEach(order -> {
                    BigDecimal[] values = daily.computeIfAbsent(order.getOrderDate(), ignored -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
                    values[0] = values[0].add(order.getPrice());
                });

        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expenses = BigDecimal.ZERO;
        List<Map<String, Object>> points = new ArrayList<>();
        for (Map.Entry<LocalDate, BigDecimal[]> day : daily.entrySet()) {
            income = income.add(day.getValue()[0]);
            expenses = expenses.add(day.getValue()[1]);
            points.add(Map.of(
                    "date", day.getKey(),
                    "income", income,
                    "expenses", expenses,
                    "balance", income.subtract(expenses)
            ));
        }
        return points;
    }

    @PutMapping("/summary")
    public Map<String, BigDecimal> updateSummary(@RequestBody Map<String, BigDecimal> values) {
        FinanceTotals totals = totalsRepository.findById(1L).orElseGet(FinanceTotals::new);
        totals.setExpenses(values.getOrDefault("expenses", BigDecimal.ZERO).max(BigDecimal.ZERO));
        BigDecimal completedRevenue = orderRepository.sumCompletedRevenue();
        BigDecimal requestedIncome = values.getOrDefault("income", BigDecimal.ZERO).max(BigDecimal.ZERO);
        if (values.containsKey("balance")) {
            totals.setBalance(values.get("balance"));
            totals.setIncome(values.get("balance").add(totals.getExpenses()).subtract(completedRevenue));
        } else {
            totals.setIncome(requestedIncome.subtract(completedRevenue).max(BigDecimal.ZERO));
            totals.setBalance(totals.getIncome().add(completedRevenue).subtract(totals.getExpenses()));
        }
        return summaryMap(totalsRepository.save(totals), orderRepository.sumCompletedRevenue());
    }

    @PostMapping
    public ResponseEntity<FinanceEntry> create(@Valid @RequestBody FinanceEntry entry) {
        entry.setId(null);
        FinanceTotals totals = totalsRepository.findById(1L).orElseGet(FinanceTotals::new);
        if (entry.getType() == FinanceType.INCOME) totals.setIncome(totals.getIncome().add(entry.getAmount()));
        else totals.setExpenses(totals.getExpenses().add(entry.getAmount()));
        totals.setBalance(totals.getIncome().add(orderRepository.sumCompletedRevenue()).subtract(totals.getExpenses()));
        totalsRepository.save(totals);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(entry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FinanceEntry> update(@PathVariable Long id, @Valid @RequestBody FinanceEntry updated) {
        return repository.findById(id).map(existing -> {
            existing.setType(updated.getType());
            existing.setCategory(updated.getCategory());
            existing.setDescription(updated.getDescription());
            existing.setAmount(updated.getAmount());
            existing.setEntryDate(updated.getEntryDate());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        FinanceEntry entry = repository.findById(id).orElse(null);
        if (entry == null) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        FinanceTotals totals = totalsRepository.findById(1L).orElse(null);
        if (totals != null) {
            if (entry.getType() == FinanceType.INCOME) totals.setIncome(totals.getIncome().subtract(entry.getAmount()).max(BigDecimal.ZERO));
            else totals.setExpenses(totals.getExpenses().subtract(entry.getAmount()).max(BigDecimal.ZERO));
            totals.setBalance(totals.getIncome().add(orderRepository.sumCompletedRevenue()).subtract(totals.getExpenses()));
            totalsRepository.save(totals);
        }
        return ResponseEntity.noContent().build();
    }

    private Map<String, BigDecimal> summaryMap(FinanceTotals totals, BigDecimal completedRevenue) {
        BigDecimal income = totals.getIncome().add(completedRevenue);
        BigDecimal balance = totals.getBalance() == null
                ? income.subtract(totals.getExpenses())
                : totals.getBalance();
        return Map.of(
                "income", income,
                "completedRevenue", completedRevenue,
                "expenses", totals.getExpenses(),
                "balance", balance);
    }
}
