import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import { Category } from '../../core/models';

@Component({
  selector: 'app-categories',
  imports: [FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class CategoriesComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected editingId: string | null = null;
  protected categoryName = '';

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.http.get<Category[]>('/api/categories').subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(apiErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected openCreate(): void {
    this.editingId = null;
    this.categoryName = '';
    this.formError.set('');
    this.showForm.set(true);
  }

  protected openEdit(category: Category): void {
    this.editingId = category._id;
    this.categoryName = category.categoryName;
    this.formError.set('');
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.formError.set('');
  }

  protected save(): void {
    const payload = { categoryName: this.categoryName.trim() };
    this.saving.set(true);
    this.formError.set('');
    const request = this.editingId
      ? this.http.put(`/api/categories/${this.editingId}`, payload)
      : this.http.post('/api/categories', payload);

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

  protected removeCategory(category: Category): void {
    const confirmed = window.confirm(
      `Delete category "${category.categoryName}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }
    this.errorMessage.set('');
    this.http.delete(`/api/categories/${category._id}`).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.errorMessage.set(apiErrorMessage(error)),
    });
  }
}
