import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api';

export interface StockProduct {
  id: number;
  name: string;
  description: string;
  imageData: string;
  price: number;
  productDate: string;
}
export type NewStockProduct = Omit<StockProduct, 'id'>;

@Injectable({ providedIn: 'root' })
export class StockProductsService {
  private readonly http = inject(HttpClient);
  private readonly products = signal<StockProduct[]>([]);
  getProducts(): StockProduct[] { return this.products(); }
  loadProducts(): Observable<StockProduct[]> {
    return this.http.get<StockProduct[]>(`${API_URL}/stock-products`).pipe(tap((items) => this.products.set(items)));
  }
  addProduct(product: NewStockProduct): Observable<StockProduct> {
    return this.http.post<StockProduct>(`${API_URL}/stock-products`, product).pipe(tap((created) => this.products.update((items) => [created, ...items])));
  }
  updateProduct(product: StockProduct): Observable<StockProduct> {
    return this.http.put<StockProduct>(`${API_URL}/stock-products/${product.id}`, product).pipe(tap((updated) => this.products.update((items) => items.map((item) => item.id === updated.id ? updated : item))));
  }
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/stock-products/${id}`).pipe(tap(() => this.products.update((items) => items.filter((item) => item.id !== id))));
  }
}
