import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const message = error.error?.message;
    if (Array.isArray(message)) {
      return message.join(' ');
    }
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
    if (error.status === 0) {
      return 'Unable to reach the server. Please try again.';
    }
    return 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
