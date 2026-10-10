import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InventoryRecord, InventoryService } from '../../core/inventory';
import { OrderRecord, Orders } from '../../core/orders';
import { FinanceService, FinanceSummary } from '../../core/finance';
import { getPaginationPages } from '../../shared/pagination/pagination';

interface MonthBar {
  label: string;
  count: number;
  heightPercent: number;
}

interface StatusSummary {
  label: string;
  count: number;
  widthPercent: number;
  className: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly ordersService = inject(Orders);
  private readonly inventoryService = inject(InventoryService);
  private readonly financeService = inject(FinanceService);
  financeSummary: FinanceSummary = this.financeService.getCachedSummary() ?? { income: 0, completedRevenue: 0, expenses: 0, balance: 0 };

  get monthlyRevenue(): number {
  return this.orders
    .filter((order) => order.status === 'Completed')
    .reduce((sum, order) => sum + order.price, 0);
}
  ordersError = '';
  inventoryError = '';
  loadingOrders = true;
  loadingInventory = true;
  currentPage = 1;
  readonly pageSize = 8;
  readonly statusLabels = ['Pending', 'Ready', 'Picked up', 'Completed', 'Cancelled'];

  ngOnInit(): void {
    this.ordersService.loadOrders().subscribe({
      next: () => { this.loadingOrders = false; this.financeSummary = { ...this.financeSummary, completedRevenue: this.monthlyRevenue }; },
      error: () => {
        this.loadingOrders = false;
        this.ordersError = 'Orders could not be loaded from the database.';
      },
    });

    this.inventoryService.loadItems().subscribe({
      next: () => this.loadingInventory = false,
      error: () => {
        this.loadingInventory = false;
        this.inventoryError = 'Inventory could not be loaded.';
      },
    });

    this.financeService.getSummary().subscribe({
      next: (summary) => this.financeSummary = summary,
      error: () => this.financeSummary = { income: 0, completedRevenue: 0, expenses: 0, balance: 0 },
    });
  }

  get moneyWeHave(): number {
    return this.financeSummary.balance;
  }

  get orders(): OrderRecord[] {
    return this.ordersService.getOrders();
  }

  get inventoryItems(): InventoryRecord[] {
    return this.inventoryService.getItems().slice(0, 5);
  }

  get totalOrders(): number {
    return this.orders.length;
  }

  get activeOrders(): number {
    return this.orders.filter((order) => order.status !== 'Completed' && order.status !== 'Cancelled').length;
  }

  get ordersThisMonth(): number {
    const monthKey = this.monthKey(new Date());
    return this.orders.filter((order) => order.orderDate?.slice(0, 7) === monthKey).length;
  }

  get recentOrders(): OrderRecord[] {
    return [...this.orders]
      .sort((first, second) => second.orderDate.localeCompare(first.orderDate));
  }

  get paginatedRecentOrders(): OrderRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.recentOrders.slice(start, start + this.pageSize);
  }

  get pageCount(): number {
    return Math.ceil(this.recentOrders.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return getPaginationPages(this.currentPage, this.pageCount);
  }

  get monthBars(): MonthBar[] {
    const currentDate = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5 + index, 1);
      const key = this.monthKey(date);
      return {
        label: new Intl.DateTimeFormat('en', { month: 'short' }).format(date),
        count: this.orders.filter((order) => order.orderDate?.slice(0, 7) === key).length,
      };
    });
    const maxCount = Math.max(1, ...months.map((month) => month.count));
    return months.map((month) => ({
      ...month,
      heightPercent: month.count ? Math.max(8, (month.count / maxCount) * 100) : 3,
    }));
  }

  get statusSummary(): StatusSummary[] {
    const counts = this.statusLabels.map((label) => this.orders.filter((order) => order.status === label).length);
    const maxCount = Math.max(1, ...counts);
    return this.statusLabels.map((label, index) => ({
      label,
      count: counts[index],
      widthPercent: counts[index] ? Math.max(5, (counts[index] / maxCount) * 100) : 0,
      className: `status-fill--${this.statusKey(label)}`,
    }));
  }

  statusClass(status: string): string {
    return `status-pill--${this.statusKey(status)}`;
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private statusKey(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}
