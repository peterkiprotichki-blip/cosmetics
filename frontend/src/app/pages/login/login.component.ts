import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/api-error';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected username = '';
  protected password = '';
  protected readonly errorMessage = signal('');
  protected readonly submitting = signal(false);

  protected submit(form: NgForm): void {
    if (form.invalid || this.submitting()) {
      return;
    }
    this.errorMessage.set('');
    this.submitting.set(true);
    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }
}
