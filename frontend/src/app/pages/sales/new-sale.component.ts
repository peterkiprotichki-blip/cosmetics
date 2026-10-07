import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { Product, Sale } from '../../core/models';
import { AlertComponent } from '../../shared/alert.component';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

interface CartLine {
  productId: string;
  productName: string;
  brand: string;
  unitPrice: number;
  quantity: number;
}

@Component({
  selector: 'app-new-sale',
  imports: [
    FormsModule,
    DecimalPipe,
    AlertComponent,
    IconComponent,
    PageHeaderComponent,
  ],
  templateUrl: './new-sale.component.html',
  styleUrl: './new-sale.component.css',
})
export class NewSaleComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly submitting = signal(false);
  protected readonly lines = signal<CartLine[]>([]);

  protected selectedProductId = '';
  protected selectedQuantity: number | null = 1;

  protected readonly total = computed(() =>
    this.lines().reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    ),
  );

  protected readonly activeProducts = computed(() =>
    this.products().filter((product) => product.isActive),
  );

  ngOnInit(): void {
    this.http.get<Product[]>('/api/products').subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(apiErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected addLine(): void {
    const product = this.products().find(
      (item) => item._id === this.selectedProductId,
    );
    const quantity = Number(this.selectedQuantity);
    if (!product || !Number.isFinite(quantity) || quantity < 1) {
      this.errorMessage.set('Select a product and enter a valid quantity.');
      return;
    }
    this.errorMessage.set('');
    const existing = this.lines().find((line) => line.productId === product._id);
    if (existing) {
      this.lines.update((lines) =>
        lines.map((line) =>
          line.productId === product._id
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        ),
      );
    } else {
      this.lines.update((lines) => [
        ...lines,
        {
          productId: product._id,
          productName: product.productName,
          brand: product.brand,
          unitPrice: product.unitPrice,
          quantity,
        },
      ]);
    }
    this.selectedProductId = '';
    this.selectedQuantity = 1;
  }

  protected removeLine(productId: string): void {
    this.lines.update((lines) =>
      lines.filter((line) => line.productId !== productId),
    );
  }

  protected completeSale(): void {
    if (this.lines().length === 0) {
      this.errorMessage.set('Select at least one product.');
      return;
    }
    this.errorMessage.set('');
    this.submitting.set(true);
    const items = this.lines().map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
    }));
    this.http.post<Sale>('/api/sales', { items }).subscribe({
      next: (sale) => {
        this.submitting.set(false);
        this.router.navigate(['/receipt', sale._id]);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }
}
