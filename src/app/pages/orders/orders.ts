import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderRecord, Orders as OrdersService } from '../../core/orders';
import { getPaginationPages } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrl: './orders.css',
  templateUrl: './orders.html',
})
export class Orders implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);

  pageMode: 'all' | 'ready' | 'delivered' = 'all';
  searchTerm = '';
  clientFilter = '';
  descriptionFilter = '';
  idFilter = '';
  statusFilter = 'all';
  sortBy = 'date-desc';
  currentPage = 1;
  readonly pageSize = 8;
  selectedOrder: OrderRecord | null = null;
  isEditing = false;
  isSaving = false;
  readonly allStatuses = ['Pending', 'Ready', 'Picked up', 'Completed', 'Cancelled'];
  errorMessage = '';

  ngOnInit(): void {
    this.pageMode = this.route.snapshot.data['ordersView'] ?? 'all';
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm = params.get('q') ?? '';
      this.currentPage = 1;
    });
    this.ordersService.loadOrders().subscribe({
      error: () => this.errorMessage = 'Could not load orders from the database. Check that the backend is running.',
    });
  }

  get filteredOrders(): OrderRecord[] {
    const orders = this.ordersService.getOrders();

    const filtered = orders.filter((order) => {
      let matchesPage = true;
      if (this.pageMode === 'ready') {
        matchesPage = order.status === 'Ready' || order.status === 'Picked up';
      } else if (this.pageMode === 'delivered') {
        matchesPage = order.status === 'Completed';
      }
      const matchesStatus = this.statusFilter === 'all' || this.statusKey(order.status) === this.statusFilter;
      const query = this.searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        order.orderId.toLowerCase().includes(query) ||
        `${order.firstName} ${order.lastName}`.toLowerCase().includes(query) ||
        order.phone.toLowerCase().includes(query) ||
        order.address.toLowerCase().includes(query) ||
        order.description.toLowerCase().includes(query);
      const matchesTableFilters =
        (!this.idFilter.trim() || order.orderId.toLowerCase().includes(this.idFilter.trim().toLowerCase())) &&
        (!this.clientFilter.trim() || `${order.firstName} ${order.lastName} ${order.phone} ${order.address}`.toLowerCase().includes(this.clientFilter.trim().toLowerCase())) &&
        (!this.descriptionFilter.trim() || order.description.toLowerCase().includes(this.descriptionFilter.trim().toLowerCase()));

      return matchesPage && matchesStatus && matchesSearch && matchesTableFilters;
    });

    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'date-asc':
          return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        case 'name-asc':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'name-desc':
          return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
        case 'id-asc':
          return a.orderId.localeCompare(b.orderId);
        case 'id-desc':
          return b.orderId.localeCompare(a.orderId);
        case 'date-desc':
        default:
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      }
    });
  }

  get pageTitle(): string {
    if (this.pageMode === 'ready') return 'Ready In Stock';
    if (this.pageMode === 'delivered') return 'Delivered';
    return 'Orders';
  }

  get paginatedOrders(): OrderRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get pageCount(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return getPaginationPages(this.currentPage, this.pageCount);
  }

  get pageStatuses(): string[] {
    if (this.pageMode === 'ready') return ['Ready', 'Picked up'];
    if (this.pageMode === 'delivered') return ['Completed'];
    return this.allStatuses;
  }

  get emptyMessage(): string {
    if (this.pageMode === 'ready') return 'No orders are ready or picked up.';
    if (this.pageMode === 'delivered') return 'No delivered orders yet.';
    return 'No orders found in the database.';
  }

  statusKey(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  statusClass(status: string): string {
    return `status-pill--${this.statusKey(status)}`;
  }

  openOrderDetails(order: OrderRecord): void {
    this.selectedOrder = { ...order };
    this.isEditing = false;
  }

  closeOrderDetails(): void {
    this.selectedOrder = null;
    this.isEditing = false;
  }

  startEditing(): void { this.isEditing = true; }

  addOrderLine(): void {
    this.selectedOrder?.orderItems.push({ modelUrl: '', quantity: 1 });
  }

  removeOrderLine(index: number): void {
    if (this.selectedOrder && this.selectedOrder.orderItems.length > 1) {
      this.selectedOrder.orderItems.splice(index, 1);
    }
  }

  saveSelectedOrder(): void {
    if (!this.selectedOrder || this.isSaving) return;
    this.isSaving = true;
    this.ordersService.updateOrder(this.selectedOrder).subscribe({
      next: (updated) => { this.selectedOrder = { ...updated }; this.isEditing = false; this.isSaving = false; },
      error: () => { this.errorMessage = 'Could not save the order changes.'; this.isSaving = false; },
    });
  }

  saveSelectedOrderStatus(): void {
    if (!this.selectedOrder) {
      return;
    }

    this.ordersService.updateOrderStatus(this.selectedOrder.orderId, this.selectedOrder.status).subscribe({
      next: () => this.closeOrderDetails(),
      error: () => this.errorMessage = 'Could not update the order status. Restart the backend and try again.',
    });
  }

  deleteSelectedOrder(): void {
    if (!this.selectedOrder) {
      return;
    }

    this.ordersService.deleteOrder(this.selectedOrder.orderId).subscribe({
      next: () => {
        this.closeOrderDetails();
        this.clampCurrentPage();
      },
    });
  }

  private clampCurrentPage(): void {
    this.currentPage = Math.min(this.currentPage, Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize)));
  }
}
