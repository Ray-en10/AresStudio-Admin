import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Auth } from '../../core/auth';
import { InventoryService } from '../../core/inventory';
import { Orders } from '../../core/orders';
import { Shell } from './shell';

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: { logout: () => of(undefined) } },
        { provide: Orders, useValue: { loadOrders: () => of([]), getOrders: () => [] } },
        { provide: InventoryService, useValue: { loadItems: () => of([]), getItems: () => [] } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
