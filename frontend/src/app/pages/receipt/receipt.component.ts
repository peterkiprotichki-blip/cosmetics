import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { Sale } from '../../core/models';

@Component({
  selector: 'app-receipt',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './receipt.component.html',
  styleUrl: './receipt.component.css',
})
export class ReceiptComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  protected readonly sale = signal<Sale | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    const saleId = this.route.snapshot.paramMap.get('id');
    if (!saleId) {
      this.errorMessage.set('Sale not found.');
      this.loading.set(false);
      return;
    }
    this.http.get<Sale>(`/api/sales/${saleId}`).subscribe({
      next: (data) => {
        this.sale.set(data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(apiErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected printReceipt(): void {
    window.print();
  }
}
