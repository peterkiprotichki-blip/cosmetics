import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import { AppUser } from '../../core/models';
import { AlertComponent } from '../../shared/alert.component';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

interface UserFormState {
  _id: string | null;
  fullName: string;
  username: string;
  password: string;
  role: string;
  isActive: boolean;
}

function emptyForm(): UserFormState {
  return {
    _id: null,
    fullName: '',
    username: '',
    password: '',
    role: 'Attendant',
    isActive: true,
  };
}

@Component({
  selector: 'app-users',
  imports: [FormsModule, AlertComponent, IconComponent, PageHeaderComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly users = signal<AppUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected form: UserFormState = emptyForm();

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.http.get<AppUser[]>('/api/users').subscribe({
      next: (data) => {
        this.users.set(data);
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

  protected openEdit(user: AppUser): void {
    this.form = {
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      password: '',
      role: user.role,
      isActive: user.isActive,
    };
    this.formError.set('');
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.formError.set('');
  }

  protected save(): void {
    this.saving.set(true);
    this.formError.set('');

    if (this.form._id) {
      const payload: {
        fullName: string;
        role: string;
        isActive: boolean;
        password?: string;
      } = {
        fullName: this.form.fullName.trim(),
        role: this.form.role,
        isActive: this.form.isActive,
      };
      if (this.form.password) {
        payload.password = this.form.password;
      }
      this.http.put(`/api/users/${this.form._id}`, payload).subscribe({
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
      return;
    }

    this.http
      .post('/api/users', {
        fullName: this.form.fullName.trim(),
        username: this.form.username.trim(),
        password: this.form.password,
        role: this.form.role,
      })
      .subscribe({
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
}
