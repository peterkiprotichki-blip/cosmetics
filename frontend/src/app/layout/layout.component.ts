import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

interface NavigationItem {
  path: string;
  label: string;
  adminOnly: boolean;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly drawerOpen = signal(false);

  private readonly navigation: NavigationItem[] = [
    { path: '/', label: 'Dashboard', adminOnly: false },
    { path: '/products', label: 'Products', adminOnly: false },
    { path: '/sales/new', label: 'New sale', adminOnly: false },
    { path: '/sales', label: 'Sales', adminOnly: false },
    { path: '/purchases', label: 'Purchases', adminOnly: true },
    { path: '/suppliers', label: 'Suppliers', adminOnly: true },
    { path: '/categories', label: 'Categories', adminOnly: true },
    { path: '/reports', label: 'Reports', adminOnly: true },
    { path: '/users', label: 'Users', adminOnly: true },
  ];

  protected get visibleNavigation(): NavigationItem[] {
    return this.navigation.filter(
      (item) => !item.adminOnly || this.auth.isAdmin(),
    );
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }
}
