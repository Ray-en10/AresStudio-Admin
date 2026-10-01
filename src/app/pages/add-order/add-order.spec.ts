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

  it('should allow adding and removing model rows', () => {
    expect(component.orderLines.length).toBe(1);

    component.addOrderLine();
    expect(component.orderLines.length).toBe(2);

    component.removeOrderLine(0);
    expect(component.orderLines.length).toBe(1);
  });

  it('should allow an empty order description', () => {
    expect(component.orderForm.controls.description.hasError('required')).toBe(false);
  });

  it('should not ask the user to enter an order ID', () => {
    expect('orderId' in component.orderForm.controls).toBe(false);
  });
});
