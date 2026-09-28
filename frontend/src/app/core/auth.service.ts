import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem('token'));
  readonly userName = signal<string>(localStorage.getItem('name') ?? '');
  readonly role = signal<string>(localStorage.getItem('role') ?? '');
  readonly isAdmin = computed(() => this.role() === 'Admin');

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { username, password })
      .pipe(
        tap((response) => {
          localStorage.setItem('token', response.accessToken);
          localStorage.setItem('name', response.name);
          localStorage.setItem('role', response.role);
          this.token.set(response.accessToken);
          this.userName.set(response.name);
          this.role.set(response.role);
        }),
      );
  }

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    this.token.set(null);
    this.userName.set('');
    this.role.set('');
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }
}
