import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API_URL } from './api';

export type FinanceType = 'INCOME' | 'EXPENSE';
export interface FinanceEntry { id: number; type: FinanceType; category: string; description: string; amount: number; entryDate: string; }
export interface FinanceSummary { income: number; completedRevenue: number; expenses: number; balance: number; }
export interface FinanceGrowthPoint { date: string; income: number; expenses: number; balance: number; }

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly entries = signal<FinanceEntry[]>([]);
  private readonly summaryStorageKey = 'ares3d-finance-summary';
  getEntries(): FinanceEntry[] { return this.entries(); }
  getCachedSummary(): FinanceSummary | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const value = JSON.parse(localStorage.getItem(this.summaryStorageKey) ?? 'null') as Partial<FinanceSummary> | null;
      if (!value) return null;
      return {
        income: Number(value.income ?? 0),
        completedRevenue: Number(value.completedRevenue ?? 0),
        expenses: Number(value.expenses ?? 0),
        balance: Number(value.balance ?? 0),
      };
    } catch {
      return null;
    }
  }
  loadEntries(): Observable<FinanceEntry[]> { return this.http.get<FinanceEntry[]>(`${API_URL}/finance`).pipe(tap((items) => this.entries.set(items))); }
  getSummary(): Observable<FinanceSummary> {
    return this.http.get<Partial<FinanceSummary>>(`${API_URL}/finance/summary`).pipe(
      map((summary) => ({
        income: Number(summary.income ?? 0),
        completedRevenue: Number(summary.completedRevenue ?? 0),
        expenses: Number(summary.expenses ?? 0),
        balance: Number(summary.balance ?? 0),
      })),
      tap((summary) => {
        if (typeof localStorage !== 'undefined') localStorage.setItem(this.summaryStorageKey, JSON.stringify(summary));
      }),
    );
  }
  getGrowth(): Observable<FinanceGrowthPoint[]> {
    return this.http.get<FinanceGrowthPoint[]>(`${API_URL}/finance/growth`).pipe(
      map((points) => points.map((point) => ({
        date: point.date,
        income: Number(point.income ?? 0),
        expenses: Number(point.expenses ?? 0),
        balance: Number(point.balance ?? 0),
      }))),
      catchError(() => of([])),
    );
  }
  updateSummary(summary: Partial<FinanceSummary>): Observable<FinanceSummary> {
    return this.http.put<FinanceSummary>(`${API_URL}/finance/summary`, summary);
  }
  addEntry(entry: Omit<FinanceEntry, 'id'>): Observable<FinanceEntry> { return this.http.post<FinanceEntry>(`${API_URL}/finance`, entry).pipe(tap((created) => this.entries.update((items) => [created, ...items]))); }
  deleteEntry(id: number): Observable<void> { return this.http.delete<void>(`${API_URL}/finance/${id}`).pipe(tap(() => this.entries.update((items) => items.filter((entry) => entry.id !== id)))); }
}
