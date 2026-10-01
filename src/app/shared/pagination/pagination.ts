import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  @Input() totalItems = 0;
  @Input() pageSize = 8;
  @Input() currentPage = 1;
  @Output() pageChange = new EventEmitter<number>();

  get pageCount(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get visiblePages(): number[] {
    const firstPage = Math.max(1, Math.min(this.currentPage - 2, this.pageCount - 4));
    const lastPage = Math.min(this.pageCount, firstPage + 4);
    return Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index);
  }

  get firstVisiblePage(): number {
    return this.visiblePages[0] ?? 1;
  }

  get lastVisiblePage(): number {
    return this.visiblePages[this.visiblePages.length - 1] ?? 1;
  }

  selectPage(page: number): void {
    if (page >= 1 && page <= this.pageCount && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}