import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize, timeout } from 'rxjs';
import { FinanceEntry, FinanceGrowthPoint, FinanceService, FinanceSummary } from '../../core/finance';
import { OrderRecord, Orders as OrdersService } from '../../core/orders';

@Component({ selector: 'app-finance', standalone: true, imports: [CommonModule, FormsModule, ReactiveFormsModule], templateUrl: './finance.html', styleUrl: './finance.css' })
export class Finance implements OnInit {
  private readonly fb = inject(FormBuilder); private readonly service = inject(FinanceService); private readonly ordersService = inject(OrdersService);
  entries: FinanceEntry[] = []; growth: FinanceGrowthPoint[] = []; completedOrders: OrderRecord[] = []; summary: FinanceSummary = this.service.getCachedSummary() ?? { income: 0, completedRevenue: 0, expenses: 0, balance: 0 }; errorMessage = ''; isSaving = false;
  editingSummary = false;
  editingEarned = false;
  editingSummaryField: 'income' | 'expenses' | 'balance' | null = null;
  readonly form = this.fb.nonNullable.group({ type: ['INCOME' as 'INCOME' | 'EXPENSE', Validators.required], category: ['Sales', Validators.required], description: ['', Validators.required], amount: [0, [Validators.required, Validators.min(0)]], entryDate: [this.today(), Validators.required] });
  readonly summaryForm = this.fb.nonNullable.group({ income: [0, [Validators.required, Validators.min(0)]], expenses: [0, [Validators.required, Validators.min(0)]], balance: [0, Validators.required] });
  ngOnInit(): void {
    this.service.loadEntries().subscribe({ next: (items) => { this.entries = items; this.updateExpensesFromEntries(); this.buildGrowthTimeline(); }, error: () => this.errorMessage = 'Could not load finance records.' });
    this.ordersService.loadOrders().subscribe({ next: (orders) => { this.completedOrders = orders.filter((order) => order.status === 'Completed'); this.updateEarnedFromOrders(); this.buildGrowthTimeline(); }, error: () => this.errorMessage = 'Could not load completed orders.' });
    this.refreshSummary();
  }
  save(): void { if (this.form.invalid || this.isSaving) { this.form.markAllAsTouched(); return; } this.isSaving = true; this.service.addEntry(this.form.getRawValue()).subscribe({ next: (entry) => { this.entries = [entry, ...this.entries]; this.form.reset({ type: 'INCOME', category: 'Sales', description: '', amount: 0, entryDate: this.today() }); this.refreshSummary(); this.refreshGrowth(); this.isSaving = false; }, error: () => { this.isSaving = false; this.errorMessage = 'Could not save this finance record.'; } }); }
  remove(entry: FinanceEntry): void { this.service.deleteEntry(entry.id).subscribe({ next: () => { this.entries = this.entries.filter((item) => item.id !== entry.id); this.refreshSummary(); this.refreshGrowth(); }, error: () => this.errorMessage = 'Could not delete this record.' }); }
  editSummary(field: 'income' | 'expenses' | 'balance'): void { this.summaryForm.reset({ income: this.summary.income, expenses: this.summary.expenses, balance: this.summary.balance }); this.editingSummaryField = field; this.editingSummary = true; }
  editEarned(): void { this.editingEarned = true; }
  cancelEarnedEdit(): void { this.editingEarned = false; }
  saveEarned(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    forkJoin(this.completedOrders.map((order) => this.ordersService.updateOrderPrice(order))).pipe(
      timeout({ first: 10000 }),
      finalize(() => this.isSaving = false),
    ).subscribe({
      next: (orders) => { this.completedOrders = orders; this.editingEarned = false; this.updateEarnedFromOrders(); this.refreshSummary(); this.refreshGrowth(); },
      error: () => this.errorMessage = 'Could not save the completed order prices. Make sure the backend is restarted, then try again.',
    });
  }
  cancelSummaryEdit(): void { this.editingSummary = false; this.editingSummaryField = null; }
  saveSummary(): void {
    if (this.summaryForm.invalid || this.isSaving) { this.summaryForm.markAllAsTouched(); return; }
    this.isSaving = true;
    const values = this.summaryForm.getRawValue();
    const payload = this.editingSummaryField === 'balance'
      ? { expenses: values.expenses, balance: values.balance }
      : { income: values.income, expenses: values.expenses };
    this.service.updateSummary(payload).subscribe({
      next: (value) => { this.summary = value; this.cancelSummaryEdit(); this.isSaving = false; this.refreshSummary(); },
      error: () => { this.errorMessage = 'Could not update the finance totals. Restart the backend and try again.'; this.isSaving = false; },
      complete: () => this.isSaving = false,
    });
  }
  private refreshSummary(): void { this.service.getSummary().subscribe({ next: (value) => { const completedRevenue = this.completedOrders.length ? this.completedOrders.reduce((total, order) => total + Number(order.price || 0), 0) : value.completedRevenue; this.summary = { ...value, completedRevenue }; this.summaryForm.reset({ income: value.income, expenses: value.expenses, balance: value.balance }); }, error: () => this.errorMessage = 'Could not load the finance summary.' }); }
  private refreshGrowth(): void { this.buildGrowthTimeline(); }
  private updateEarnedFromOrders(): void {
    const completedRevenue = this.completedOrders.reduce((total, order) => total + Number(order.price || 0), 0);
    this.summary = { ...this.summary, completedRevenue };
  }
  private updateExpensesFromEntries(): void {
    const expenses = this.entries.filter((entry) => entry.type === 'EXPENSE').reduce((total, entry) => total + Number(entry.amount || 0), 0);
    if (this.summary.expenses === 0 && expenses > 0) this.summary = { ...this.summary, expenses };
  }
  private buildGrowthTimeline(): void {
    const days = new Map<string, { income: number; expenses: number }>();
    this.entries.forEach((entry) => {
      const point = days.get(entry.entryDate) ?? { income: 0, expenses: 0 };
      if (entry.type === 'INCOME') point.income += Number(entry.amount || 0);
      else point.expenses += Number(entry.amount || 0);
      days.set(entry.entryDate, point);
    });
    this.completedOrders.forEach((order) => {
      const point = days.get(order.orderDate) ?? { income: 0, expenses: 0 };
      point.income += Number(order.price || 0);
      days.set(order.orderDate, point);
    });
    let income = 0;
    let expenses = 0;
    this.growth = [...days.entries()].sort(([first], [second]) => first.localeCompare(second)).map(([date, values]) => {
      income += values.income;
      expenses += values.expenses;
      return { date, income, expenses, balance: income - expenses };
    });
  }
  private today(): string { return new Date().toISOString().split('T')[0]; }
  get chartPoints(): string {
    return this.growth.map((point, index) => `${this.chartX(index)},${this.chartY(point.balance)}`).join(' ');
  }
  chartX(index: number): number {
    return this.growth.length < 2 ? 50 : (index / (this.growth.length - 1)) * 100;
  }
  chartY(balance: number): number {
    const min = Math.min(...this.growth.map((point) => point.balance), 0);
    const max = Math.max(...this.growth.map((point) => point.balance), 0);
    return 92 - ((balance - min) / (max - min || 1)) * 78;
  }
}
