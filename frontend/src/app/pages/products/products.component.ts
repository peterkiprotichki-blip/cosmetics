import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { Category, Product, ProductPayload } from '../../core/models';
import { AlertComponent } from '../../shared/alert.component';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

interface ProductFormState {
  _id: string | null;
  productName: string;
  brand: string;
  category: string;
  unitPrice: number | null;
  costPrice: number | null;
  quantityInStock: number | null;
  reorderLevel: number | null;
  expiryDate: string;
}

function emptyForm(): ProductFormState {
  return {
    _id: null,
    productName: '',
    brand: '',
    category: '',
    unitPrice: null,
    costPrice: null,
    quantityInStock: null,
    reorderLevel: null,
    expiryDate: '',
  };
}

@Component({
  selector: 'app-products',
  imports: [
    FormsModule,
    DecimalPipe,
    DatePipe,
    AlertComponent,
    IconComponent,
    PageHeaderComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly auth = inject(AuthService);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected form: ProductFormState = emptyForm();
  protected searchText = '';

  private appliedSearch = '';
  private readonly searchInput = new Subject<string>();

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.appliedSearch = value.trim();
        this.loadProducts();
      });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  protected onSearchChange(value: string): void {
    this.searchText = value;
    this.searchInput.next(value);
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const query = this.appliedSearch
      ? `?search=${encodeURIComponent(this.appliedSearch)}`
      : '';
    this.http.get<Product[]>(`/api/products${query}`).subscribe({
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

  private loadCategories(): void {
    this.http.get<Category[]>('/api/categories').subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.categories.set([]),
    });
  }

  protected openCreate(): void {
    this.form = emptyForm();
    this.formError.set('');
    this.showForm.set(true);
  }

  protected openEdit(product: Product): void {
    this.form = {
      _id: product._id,
      productName: product.productName,
      brand: product.brand,
      category: product.category?._id ?? '',
      unitPrice: product.unitPrice,
      costPrice: product.costPrice,
      quantityInStock: product.quantityInStock,
      reorderLevel: product.reorderLevel,
      expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : '',
    };
    this.formError.set('');
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.formError.set('');
  }

  protected save(): void {
    const payload: ProductPayload = {
      productName: this.form.productName.trim(),
      category: this.form.category,
      unitPrice: Number(this.form.unitPrice),
      costPrice: Number(this.form.costPrice),
      quantityInStock: Number(this.form.quantityInStock),
      reorderLevel: Number(this.form.reorderLevel),
    };
    const brand = this.form.brand.trim();
    if (brand) {
      payload.brand = brand;
    }
    if (this.form.expiryDate) {
      payload.expiryDate = this.form.expiryDate;
    }

    this.saving.set(true);
    this.formError.set('');
    const request = this.form._id
      ? this.http.put(`/api/products/${this.form._id}`, payload)
      : this.http.post('/api/products', payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadProducts();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(apiErrorMessage(error));
      },
    });
  }

  protected toggleStatus(product: Product): void {
    this.errorMessage.set('');
    this.http
      .put(`/api/products/${product._id}`, { isActive: !product.isActive })
      .subscribe({
        next: () => this.loadProducts(),
        error: (error: unknown) => this.errorMessage.set(apiErrorMessage(error)),
      });
  }
}
