import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { Sale } from '../../core/models';

@Component({
  selector: 'app-sales-list',
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './sales-list.component.html',
  styleUrl: './sales-list.component.css',
})
export class SalesListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly sales = signal<Sale[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');

  protected fromDate = '';
  protected toDate = '';

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    let params = new HttpParams();
    if (this.fromDate) {
      params = params.set('from', this.fromDate);
    }
    if (this.toDate) {
      params = params.set('to', this.toDate);
    }
    this.http
      .get<Sale[]>('/api/sales', { params })
      .subscribe({
        next: (data) => {
          this.sales.set(data);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.errorMessage.set(apiErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  protected clearFilters(): void {
    this.fromDate = '';
    this.toDate = '';
    this.load();
  }

  protected openReceipt(sale: Sale): void {
    this.router.navigate(['/receipt', sale._id]);
  }
}
