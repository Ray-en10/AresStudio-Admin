import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_URL } from './api';

export interface InventoryRecord {
  id: number;
  name: string;
  category: string;
  color: string;
  quantity: number;
  unit: string;
}

export type NewInventoryRecord = Omit<InventoryRecord, 'id'>;

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly inventory = signal<InventoryRecord[]>([]);

  getItems(): InventoryRecord[] {
    return this.inventory();
  }

  loadItems(): Observable<InventoryRecord[]> {
    return this.http.get<InventoryRecord[]>(`${API_URL}/inventory`).pipe(
      tap((items) => this.inventory.set(items)),
    );
  }

  addStock(item: NewInventoryRecord): Observable<InventoryRecord> {
    const existing = this.inventory().find((current) =>
      current.name.trim().toLowerCase() === item.name.trim().toLowerCase() &&
      current.category.toLowerCase() === item.category.toLowerCase() &&
      current.color.toLowerCase() === item.color.toLowerCase() &&
      current.unit.toLowerCase() === item.unit.toLowerCase(),
    );

    if (existing) {
      return this.updateItem({ ...existing, quantity: existing.quantity + item.quantity });
    }

    return this.http.post<InventoryRecord>(`${API_URL}/inventory`, item).pipe(
      tap((created) => this.inventory.update((items) => [...items, created])),
    );
  }

  updateItem(item: InventoryRecord): Observable<InventoryRecord> {
    return this.http.put<InventoryRecord>(`${API_URL}/inventory/${item.id}`, item).pipe(
      tap((updated) => this.inventory.update((items) => items.map((current) => current.id === updated.id ? updated : current))),
    );
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/inventory/${id}`).pipe(
      tap(() => this.inventory.update((items) => items.filter((item) => item.id !== id))),
    );
  }
}