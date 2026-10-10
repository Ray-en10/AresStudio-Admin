package com.ares3dstudio.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "finance_totals")
public class FinanceTotals {
    @Id
    private Long id = 1L;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal income = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal expenses = BigDecimal.ZERO;
    @Column(precision = 12, scale = 2)
    private BigDecimal balance;

    public Long getId() { return id; }
    public BigDecimal getIncome() { return income; }
    public void setIncome(BigDecimal income) { this.income = income; }
    public BigDecimal getExpenses() { return expenses; }
    public void setExpenses(BigDecimal expenses) { this.expenses = expenses; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
}
