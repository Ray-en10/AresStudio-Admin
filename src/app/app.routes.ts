import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Shell } from './layout/shell/shell';
import { Dashboard } from './pages/dashboard/dashboard';
import { Orders } from './pages/orders/orders';
import { AddOrder } from './pages/add-order/add-order';
import { Inventory } from './pages/inventory/inventory';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'add-order', component: AddOrder },
      { path: 'orders', component: Orders },
      { path: 'ready-in-stock', component: Orders, data: { ordersView: 'ready' } },
      { path: 'delivered', component: Orders, data: { ordersView: 'delivered' } },
      { path: 'inventory', component: Inventory },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];