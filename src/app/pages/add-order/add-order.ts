import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderRecord, Orders as OrdersService } from '../../core/orders';

@Component({
  selector: 'app-add-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-order.html',
  styleUrl: './add-order.css',
})
export class AddOrder implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);
  errorMessage = '';
  isSaving = false;

  readonly orderForm = this.fb.nonNullable.group({
    orderId: ['', [Validators.required, Validators.minLength(3)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', [Validators.required]],
    address: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    orderDate: [this.todayString(), Validators.required],
    orderLink: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],
    status: ['Pending', Validators.required],
  });

  ngOnInit(): void {
    this.ordersService.loadOrders().subscribe({
      error: () => this.errorMessage = 'Could not load orders from the database. Check that the backend is running.',
    });
    this.ordersService.getNextOrderId().subscribe({
      next: (orderId) => this.orderForm.controls.orderId.setValue(orderId),
      error: () => this.errorMessage = 'Could not get the next order ID from the backend.',
    });
  }

  get recentOrders(): OrderRecord[] {
    return this.ordersService.getOrders().slice(0, 4);
  }

  statusClass(status: string): string {
    return `status--${status.toLowerCase().replace(/\s+/g, '-')}`;
  }

  submitOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    const newOrder: OrderRecord = {
      ...this.orderForm.getRawValue(),
      status: this.orderForm.get('status')?.value || 'Pending',
    };

    this.errorMessage = '';
    this.isSaving = true;
    this.ordersService.addOrder(newOrder).subscribe({
      next: () => this.router.navigate(['/orders']),
      error: () => {
        this.errorMessage = 'The order was not saved. Check the form and backend, then try again.';
        this.isSaving = false;
      },
    });
  }

  private todayString(): string {
    return new Date().toISOString().split('T')[0];
  }
}
