import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { BrandMarkComponent } from '../shared/brand-mark.component';
import { IconComponent } from '../shared/icon.component';

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  adminOnly: boolean;
}

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    BrandMarkComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly drawerOpen = signal(false);

  private readonly navigation: NavigationItem[] = [
    { path: '/', label: 'Dashboard', icon: 'dashboard', adminOnly: false },
    { path: '/products', label: 'Products', icon: 'box', adminOnly: false },
    {
      path: '/sales/new',
      label: 'New sale',
      icon: 'shopping-cart',
      adminOnly: false,
    },
    { path: '/sales', label: 'Sales', icon: 'receipt', adminOnly: false },
    {
      path: '/purchases',
      label: 'Purchases',
      icon: 'truck',
      adminOnly: true,
    },
    {
      path: '/suppliers',
      label: 'Suppliers',
      icon: 'store',
      adminOnly: true,
    },
    {
      path: '/categories',
      label: 'Categories',
      icon: 'tag',
      adminOnly: true,
    },
    { path: '/reports', label: 'Reports', icon: 'chart', adminOnly: true },
    { path: '/users', label: 'Users', icon: 'users', adminOnly: true },
  ];

  protected readonly initials = computed(() => {
    const parts = this.auth
      .userName()
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0);
    if (parts.length === 0) {
      return 'VC';
    }
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected get visibleNavigation(): NavigationItem[] {
    return this.navigation.filter(
      (item) => !item.adminOnly || this.auth.isAdmin(),
    );
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }
}
