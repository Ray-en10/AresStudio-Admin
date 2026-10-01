import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderLineRecord, OrderRecord, Orders as OrdersService } from '../../core/orders';

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
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', [Validators.required]],
    address: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    orderDate: [this.todayString(), Validators.required],
    orderLines: this.fb.array([this.createOrderLine()]),
    imageData: [''],
    status: ['Pending', Validators.required],
  });

  get orderLines() {
    return this.orderForm.controls.orderLines;
  }

  ngOnInit(): void {
    this.ordersService.loadOrders().subscribe({
      error: () => this.errorMessage = 'Could not load orders from the database. Check that the backend is running.',
    });
  }

  get recentOrders(): OrderRecord[] {
    return this.ordersService.getOrders().slice(0, 4);
  }

  statusClass(status: string): string {
    return `status--${status.toLowerCase().replace(/\s+/g, '-')}`;
  }

  addOrderLine(): void {
    this.orderLines.push(this.createOrderLine());
  }

  removeOrderLine(index: number): void {
    if (this.orderLines.length > 1) this.orderLines.removeAt(index);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.errorMessage = 'Choose a JPG, PNG, or WebP image.';
      input.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.errorMessage = 'The image must be 3 MB or smaller.';
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.orderForm.controls.imageData.setValue(reader.result);
        this.errorMessage = '';
      }
    };
    reader.onerror = () => this.errorMessage = 'Could not read this image. Try another file.';
    reader.readAsDataURL(file);
  }

  removeImage(input: HTMLInputElement): void {
    this.orderForm.controls.imageData.setValue('');
    input.value = '';
  }

  submitOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    const value = this.orderForm.getRawValue();
    const orderItems: OrderLineRecord[] = value.orderLines.map((line) => ({
      modelUrl: line.modelUrl.trim(),
      quantity: Number(line.quantity),
    }));
    const newOrder: OrderRecord = {
      orderId: '',
      firstName: value.firstName,
      lastName: value.lastName,
      phone: value.phone,
      address: value.address,
      description: value.description.trim(),
      price: value.price,
      orderDate: value.orderDate,
      orderLink: orderItems[0]?.modelUrl ?? '',
      orderItems,
      imageData: value.imageData,
      status: 'Pending',
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

  private createOrderLine() {
    return this.fb.nonNullable.group({
      modelUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],
      quantity: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    });
  }
}
