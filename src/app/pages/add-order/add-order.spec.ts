import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddOrder } from './add-order';

describe('AddOrder', () => {
  let component: AddOrder;
  let fixture: ComponentFixture<AddOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddOrder],
    }).compileComponents();

    fixture = TestBed.createComponent(AddOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default the order status to pending', () => {
    expect(component.orderForm.get('status')?.value).toBe('Pending');
  });
});
