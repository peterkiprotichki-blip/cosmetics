import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { ProductsComponent } from './pages/products/products.component';
import { PurchasesComponent } from './pages/purchases/purchases.component';
import { ReceiptComponent } from './pages/receipt/receipt.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { NewSaleComponent } from './pages/sales/new-sale.component';
import { SalesListComponent } from './pages/sales/sales-list.component';
import { SuppliersComponent } from './pages/suppliers/suppliers.component';
import { UsersComponent } from './pages/users/users.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Sign in — Victory Cosmetics',
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardComponent,
        title: 'Dashboard — Victory Cosmetics',
      },
      {
        path: 'products',
        component: ProductsComponent,
        title: 'Products — Victory Cosmetics',
      },
      {
        path: 'sales',
        component: SalesListComponent,
        title: 'Sales — Victory Cosmetics',
      },
      {
        path: 'sales/new',
        component: NewSaleComponent,
        title: 'New sale — Victory Cosmetics',
      },
      {
        path: 'receipt/:id',
        component: ReceiptComponent,
        title: 'Receipt — Victory Cosmetics',
      },
      {
        path: 'purchases',
        component: PurchasesComponent,
        canActivate: [adminGuard],
        title: 'Purchases — Victory Cosmetics',
      },
      {
        path: 'suppliers',
        component: SuppliersComponent,
        canActivate: [adminGuard],
        title: 'Suppliers — Victory Cosmetics',
      },
      {
        path: 'categories',
        component: CategoriesComponent,
        canActivate: [adminGuard],
        title: 'Categories — Victory Cosmetics',
      },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [adminGuard],
        title: 'Reports — Victory Cosmetics',
      },
      {
        path: 'users',
        component: UsersComponent,
        canActivate: [adminGuard],
        title: 'Users — Victory Cosmetics',
      },
      {
        path: 'access-denied',
        component: AccessDeniedComponent,
        title: 'Access denied — Victory Cosmetics',
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
