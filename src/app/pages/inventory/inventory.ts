import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InventoryRecord, InventoryService } from '../../core/inventory';
import { getPaginationPages } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryService);
  private readonly route = inject(ActivatedRoute);

  readonly stockForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['Filament', Validators.required],
    color: ['#d55c45'],
    quantity: [1, [Validators.required, Validators.min(0)]],
    unit: ['g', Validators.required],
  });

  categoryFilter = 'All';
  searchTerm = '';
  currentPage = 1;
  readonly pageSize = 8;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  editingItem: InventoryRecord | null = null;
  private readonly updatingIds = new Set<number>();

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm = params.get('q') ?? '';
      this.currentPage = 1;
    });
    this.inventoryService.loadItems().subscribe({
      next: () => this.isLoading = false,
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Could not load equipment from the database. Check that the backend is running.';
      },
    });
  }

  get items(): InventoryRecord[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.inventoryService.getItems().filter((item) => {
      const matchesCategory = this.categoryFilter === 'All' || item.category === this.categoryFilter;
      const matchesQuery = !query || `${item.name} ${item.category} ${item.color}`.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }

  get totalItems(): number {
    return this.inventoryService.getItems().length;
  }

  get paginatedItems(): InventoryRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  }

  get pageCount(): number {
    return Math.ceil(this.items.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return getPaginationPages(this.currentPage, this.pageCount);
  }

  get filamentColors(): number {
    return this.inventoryService.getItems().filter((item) => item.category === 'Filament' && item.color).length;
  }

  get categoryCount(): number {
    return new Set(this.inventoryService.getItems().map((item) => item.category)).size;
  }

  get isFilament(): boolean {
    return this.stockForm.controls.category.value === 'Filament';
  }

  addStock(): void {
    const quantity = this.stockForm.controls.quantity.value;
    if (this.stockForm.invalid || this.isSaving || (!this.editingItem && quantity <= 0)) {
      this.stockForm.markAllAsTouched();
      return;
    }

    const value = this.stockForm.getRawValue();
    const item = {
      ...value,
      name: value.name.trim(),
      color: value.category === 'Filament' ? value.color : '',
    };

    this.errorMessage = '';
    this.successMessage = '';
    this.isSaving = true;
    const request = this.editingItem
      ? this.inventoryService.updateItem({ ...this.editingItem, ...item })
      : this.inventoryService.addStock(item);
    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = this.editingItem ? 'Equipment updated.' : 'Stock saved to the database.';
        this.cancelEditing();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Stock was not saved. Check the backend and try again.';
      },
    });
  }

  startEditing(item: InventoryRecord): void {
    this.editingItem = item;
    this.errorMessage = '';
    this.successMessage = '';
    this.stockForm.reset({
      name: item.name,
      category: item.category,
      color: item.color || '#d55c45',
      quantity: item.quantity,
      unit: item.unit,
    });
  }

  cancelEditing(): void {
    this.editingItem = null;
    this.stockForm.reset({ name: '', category: 'Filament', color: '#d55c45', quantity: 1, unit: 'g' });
  }

  adjustStock(item: InventoryRecord, adjustment: number): void {
    if (this.updatingIds.has(item.id)) return;

    const quantity = Math.max(0, Math.round((item.quantity + adjustment) * 100) / 100);
    if (quantity === item.quantity) return;

    this.errorMessage = '';
    this.updatingIds.add(item.id);
    this.inventoryService.updateItem({ ...item, quantity }).subscribe({
      next: () => this.updatingIds.delete(item.id),
      error: () => {
        this.updatingIds.delete(item.id);
        this.errorMessage = `Could not update stock for ${item.name}.`;
      },
    });
  }

  deleteItem(item: InventoryRecord): void {
    if (this.updatingIds.has(item.id)) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.updatingIds.add(item.id);
    this.inventoryService.deleteItem(item.id).subscribe({
      next: () => {
        this.updatingIds.delete(item.id);
        if (this.editingItem?.id === item.id) this.cancelEditing();
        this.successMessage = `${item.name} deleted from inventory.`;
        this.currentPage = Math.min(this.currentPage, Math.max(1, Math.ceil(this.items.length / this.pageSize)));
      },
      error: () => {
        this.updatingIds.delete(item.id);
        this.errorMessage = `Could not delete ${item.name}.`;
      },
    });
  }

  isUpdating(item: InventoryRecord): boolean {
    return this.updatingIds.has(item.id);
  }
}