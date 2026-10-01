import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Orders as OrdersService } from '../../core/orders';
import { Orders } from './orders';

describe('Orders', () => {
  let component: Orders;
  let fixture: ComponentFixture<Orders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Orders],
      providers: [
        provideRouter([]),
        { provide: OrdersService, useValue: { loadOrders: () => of([]), getOrders: () => [] } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Orders);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
