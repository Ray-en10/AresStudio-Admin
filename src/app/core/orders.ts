import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_URL } from './api';

export interface OrderRecord {
  id?: number;
  orderId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  description: string;
  price: number;
  orderDate: string;
  orderLink: string;
  orderItems: OrderLineRecord[];
  imageData: string;
  status: string;
}

export interface OrderLineRecord {
  modelUrl: string;
  quantity: number;
}

interface ApiOrder {
  id: number;
  orderId: string | null;
  name: string;
  lastName: string;
  phone: string;
  address: string;
  description: string;
  price: number;
  orderDate: string;
  orderLink: string | null;
  items?: OrderLineRecord[] | null;
  imageData?: string | null;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class Orders {
  private readonly http = inject(HttpClient);
  private readonly orderList = signal<OrderRecord[]>([]);

  getOrders(): OrderRecord[] {
    return this.orderList();
  }

  loadOrders(): Observable<OrderRecord[]> {
    return this.http.get<ApiOrder[]>(`${API_URL}/orders`).pipe(
      map((orders) => orders.map((order) => this.fromApi(order))),
      tap((orders) => this.orderList.set(orders)),
    );
  }

  getMonthlyRevenue(): Observable<number> {
    return this.http.get<{ totalRevenue: number }>(`${API_URL}/orders/stats/monthly-revenue`).pipe(
      map((response) => Number(response.totalRevenue ?? 0)),
    );
  }

  addOrder(order: OrderRecord): Observable<OrderRecord> {
    return this.http.post<ApiOrder>(`${API_URL}/orders`, this.toApi(order)).pipe(
      map((created) => this.fromApi(created)),
      tap((created) => this.orderList.update((orders) => [created, ...orders])),
    );
  }

  updateOrderStatus(orderId: string, status: string): Observable<OrderRecord> {
    const order = this.orderList().find((item) => item.orderId === orderId);
    if (!order?.id) {
      throw new Error(`Order ${orderId} has no backend ID`);
    }

    return this.http.put<ApiOrder>(`${API_URL}/orders/${order.id}`, this.toApi({ ...order, status })).pipe(
      map((updated) => this.fromApi(updated)),
      tap((updated) => this.orderList.update((orders) => orders.map((item) => item.id === updated.id ? updated : item))),
    );
  }

  deleteOrder(orderId: string): Observable<void> {
    const order = this.orderList().find((item) => item.orderId === orderId);
    if (!order?.id) {
      throw new Error(`Order ${orderId} has no backend ID`);
    }

    return this.http.delete<void>(`${API_URL}/orders/${order.id}`).pipe(
      tap(() => this.orderList.update((orders) => orders.filter((item) => item.id !== order.id))),
    );
  }

  private fromApi(order: ApiOrder): OrderRecord {
    return {
      id: order.id,
      orderId: order.orderId ?? '',
      firstName: order.name,
      lastName: order.lastName,
      phone: order.phone ?? '',
      address: order.address ?? '',
      description: order.description ?? '',
      price: Number(order.price ?? 0),
      orderDate: order.orderDate ?? '',
      orderLink: order.orderLink ?? order.items?.[0]?.modelUrl ?? '',
      orderItems: order.items?.map((item) => ({ modelUrl: item.modelUrl, quantity: Number(item.quantity) })) ??
        (order.orderLink ? [{ modelUrl: order.orderLink, quantity: 1 }] : []),
      imageData: order.imageData ?? '',
      status: this.fromApiStatus(order.status),
    };
  }

  private toApi(order: OrderRecord): Omit<ApiOrder, 'id'> {
    return {
      orderId: order.orderId.trim() ? order.orderId : null,
      name: order.firstName,
      lastName: order.lastName,
      phone: order.phone,
      address: order.address,
      description: order.description,
      price: order.price,
      orderDate: order.orderDate,
      orderLink: order.orderItems[0]?.modelUrl ?? order.orderLink,
      items: order.orderItems.map((item) => ({ modelUrl: item.modelUrl, quantity: item.quantity })),
      imageData: order.imageData || null,
      status: this.toApiStatus(order.status),
    };
  }

  private fromApiStatus(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      READY: 'Ready',
      PICKED_UP: 'Picked up',
      COMPLETED: 'Completed',
    };
    return labels[status] ?? status;
  }

  private toApiStatus(status: string): string {
    const statuses: Record<string, string> = {
      Pending: 'PENDING',
      Ready: 'READY',
      'Picked up': 'PICKED_UP',
      Completed: 'COMPLETED',
    };
    return statuses[status] ?? 'PENDING';
  }
}
