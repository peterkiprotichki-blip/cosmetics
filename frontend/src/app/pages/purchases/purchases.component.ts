import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import { Product, Purchase, Supplier } from '../../core/models';
import { AlertComponent } from '../../shared/alert.component';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

interface PurchaseItemForm {
  productId: string;
  quantity: number | null;
  unitCost: number | null;
}

function emptyItem(): PurchaseItemForm {
  return { productId: '', quantity: 1, unitCost: null };
}

function dateToString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function monthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

@Component({
  selector: 'app-purchases',
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    AlertComponent,
    IconComponent,
    PageHeaderComponent,
  ],
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.css',
})
export class PurchasesComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly purchases = signal<Purchase[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingForm = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly formError = signal('');
  protected readonly saving = signal(false);

  protected supplierId = '';
  protected purchaseDate = dateToString(new Date());
  protected items: PurchaseItemForm[] = [emptyItem()];
  protected fromDate = monthStart();
  protected toDate = dateToString(new Date());

  ngOnInit(): void {
    this.loadPurchases();
    this.loadFormData();
  }

  protected get totalCost(): number {
    return this.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unitCost) || 0;
      return sum + quantity * unitCost;
    }, 0);
  }

  protected get activeProductList(): Product[] {
    return this.products().filter((product) => product.isActive);
  }

  private loadFormData(): void {
    this.loadingForm.set(true);
    this.http.get<Supplier[]>('/api/suppliers').subscribe({
      next: (data) => {
        this.suppliers.set(data);
        this.loadingForm.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(apiErrorMessage(error));
        this.loadingForm.set(false);
      },
    });
    this.http.get<Product[]>('/api/products').subscribe({
      next: (data) => this.products.set(data),
      error: () => this.products.set([]),
    });
  }

  protected loadPurchases(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    let params = new HttpParams();
    if (this.fromDate) {
      params = params.set('from', this.fromDate);
    }
    if (this.toDate) {
      params = params.set('to', this.toDate);
    }
    this.http.get<Purchase[]>('/api/purchases', { params }).subscribe({
      next: (data) => {
        this.purchases.set(data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(apiErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected addItemRow(): void {
    this.items = [...this.items, emptyItem()];
  }

  protected removeItemRow(index: number): void {
    if (this.items.length === 1) {
      this.items = [emptyItem()];
      return;
    }
    this.items = this.items.filter((_, position) => position !== index);
  }

  protected recordPurchase(): void {
    if (!this.supplierId) {
      this.formError.set('Select a supplier.');
      return;
    }
    const items = this.items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
      }));
    if (items.length === 0) {
      this.formError.set('Select at least one product.');
      return;
    }
    if (items.some((item) => !Number.isFinite(item.quantity) || item.quantity < 1)) {
      this.formError.set('Quantity must be at least 1.');
      return;
    }
    if (items.some((item) => !Number.isFinite(item.unitCost) || item.unitCost < 0)) {
      this.formError.set('Enter a valid unit cost.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    this.http
      .post('/api/purchases', {
        supplierId: this.supplierId,
        purchaseDate: this.purchaseDate,
        items,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.supplierId = '';
          this.purchaseDate = dateToString(new Date());
          this.items = [emptyItem()];
          this.loadPurchases();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.formError.set(apiErrorMessage(error));
        },
      });
  }
}
