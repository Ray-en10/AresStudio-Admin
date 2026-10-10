import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { StockProduct, StockProductsService } from '../../core/stock-products';

@Component({
  selector: 'app-stock-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './stock-products.html',
  styleUrl: './stock-products.css',
})
export class StockProducts implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(StockProductsService);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required], description: [''], imageData: [''],
    price: [0, [Validators.required, Validators.min(0)]], productDate: [this.today(), Validators.required],
  });
  editing: StockProduct | null = null; isSaving = false; errorMessage = ''; searchTerm = '';

  ngOnInit(): void { this.service.loadProducts().subscribe({ error: () => this.errorMessage = 'Could not load products. Check that the backend is running.' }); }
  get products(): StockProduct[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.service.getProducts().filter((item) => !query || `${item.name} ${item.description}`.toLowerCase().includes(query));
  }
  save(): void {
    if (this.form.invalid || this.isSaving) { this.form.markAllAsTouched(); return; }
    this.isSaving = true; this.errorMessage = '';
    const value = this.form.getRawValue();
    const request = this.editing ? this.service.updateProduct({ ...this.editing, ...value }) : this.service.addProduct(value);
    request.subscribe({ next: () => { this.isSaving = false; this.cancel(); }, error: () => { this.isSaving = false; this.errorMessage = 'Could not save this product.'; } });
  }
  edit(item: StockProduct): void { this.editing = item; this.form.reset(item); }
  cancel(): void { this.editing = null; this.form.reset({ name: '', description: '', imageData: '', price: 0, productDate: this.today() }); }
  remove(item: StockProduct): void { this.service.deleteProduct(item.id).subscribe({ error: () => this.errorMessage = 'Could not delete this product.' }); }
  handleImage(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (file) this.readImage(file); }
  onDrop(event: DragEvent): void { event.preventDefault(); const file = event.dataTransfer?.files?.[0]; if (file) this.readImage(file); }
  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent): void { const file = Array.from(event.clipboardData?.files ?? [])[0]; if (file) this.readImage(file); }
  private readImage(file: File): void { if (!file.type.startsWith('image/') || file.size > 3 * 1024 * 1024) { this.errorMessage = 'Use an image up to 3 MB.'; return; } const reader = new FileReader(); reader.onload = () => this.form.controls.imageData.setValue(String(reader.result)); reader.readAsDataURL(file); }
  private today(): string { return new Date().toISOString().split('T')[0]; }
}
