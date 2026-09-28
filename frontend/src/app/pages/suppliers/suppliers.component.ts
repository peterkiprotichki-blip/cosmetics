import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import { Supplier } from '../../core/models';

interface SupplierFormState {
  _id: string | null;
  supplierName: string;
  phone: string;
  email: string;
  location: string;
}

function emptyForm(): SupplierFormState {
  return { _id: null, supplierName: '', phone: '', email: '', location: '' };
}

@Component({
  selector: 'app-suppliers',
  imports: [FormsModule],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css',
})
export class SuppliersComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected form: SupplierFormState = emptyForm();

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.http.get<Supplier[]>('/api/suppliers').subscribe({
      next: (data) => {
        this.suppliers.set(data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(apiErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected openCreate(): void {
    this.form = emptyForm();
    this.formError.set('');
    this.showForm.set(true);
  }

  protected openEdit(supplier: Supplier): void {
    this.form = {
      _id: supplier._id,
      supplierName: supplier.supplierName,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      location: supplier.location ?? '',
    };
    this.formError.set('');
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.formError.set('');
  }

  protected save(): void {
    const payload = {
      supplierName: this.form.supplierName.trim(),
      phone: this.form.phone.trim(),
      email: this.form.email.trim(),
      location: this.form.location.trim(),
    };
    this.saving.set(true);
    this.formError.set('');
    const request = this.form._id
      ? this.http.put(`/api/suppliers/${this.form._id}`, payload)
      : this.http.post('/api/suppliers', payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(apiErrorMessage(error));
      },
    });
  }

  protected removeSupplier(supplier: Supplier): void {
    const confirmed = window.confirm(
      `Delete supplier "${supplier.supplierName}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }
    this.errorMessage.set('');
    this.http.delete(`/api/suppliers/${supplier._id}`).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.errorMessage.set(apiErrorMessage(error)),
    });
  }
}
