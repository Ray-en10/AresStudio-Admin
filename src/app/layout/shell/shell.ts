import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../core/auth';
import { InventoryService } from '../../core/inventory';
import { OrderRecord, Orders } from '../../core/orders';

interface GlobalSearchResult {
  label: string;
  detail: string;
  route: string;
  query: string;
}

@Component({
  selector: 'app-shell',
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell implements OnInit {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly ordersService = inject(Orders);
  private readonly inventoryService = inject(InventoryService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  sidebarCollapsed = false;
  searchTerm = '';
  searchFocused = false;
  searchLoading = true;

  ngOnInit(): void {
    let requestsComplete = 0;
    const finishRequest = () => {
      requestsComplete += 1;
      if (requestsComplete === 2) this.searchLoading = false;
    };
    this.ordersService.loadOrders().subscribe({ next: finishRequest, error: finishRequest });
    this.inventoryService.loadItems().subscribe({ next: finishRequest, error: finishRequest });
  }

  get searchResults(): GlobalSearchResult[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (query.length < 2) return [];

    const orderResults = this.ordersService.getOrders()
      .filter((order) => this.orderSearchText(order).includes(query))
      .slice(0, 5)
      .map((order) => this.orderResult(order));
    const inventoryResults = this.inventoryService.getItems()
      .filter((item) => `${item.name} ${item.category} ${item.color} ${item.unit}`.toLowerCase().includes(query))
      .slice(0, 5)
      .map((item) => ({
        label: item.name,
        detail: item.color
          ? `${item.category} · ${item.color} · ${item.quantity} ${item.unit}`
          : `${item.category} · ${item.quantity} ${item.unit}`,
        route: '/inventory',
        query: item.name,
      }));

    return [...orderResults, ...inventoryResults].slice(0, 8);
  }

  submitSearch(event: Event): void {
    event.preventDefault();
    const firstResult = this.searchResults[0];
    if (firstResult) this.openSearchResult(firstResult);
  }

  openSearchResult(result: GlobalSearchResult): void {
    this.searchFocused = false;
    this.router.navigate([result.route], { queryParams: { q: result.query } });
  }

  @HostListener('document:click', ['$event'])
  closeSearchOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) this.searchFocused = false;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  private orderSearchText(order: OrderRecord): string {
    return `${order.orderId} ${order.firstName} ${order.lastName} ${order.phone} ${order.address} ${order.description}`.toLowerCase();
  }

  private orderResult(order: OrderRecord): GlobalSearchResult {
    return {
      label: `#${order.orderId}`,
      detail: `${order.firstName} ${order.lastName} · ${order.status}`,
      route: '/orders',
      query: order.orderId,
    };
  }
}