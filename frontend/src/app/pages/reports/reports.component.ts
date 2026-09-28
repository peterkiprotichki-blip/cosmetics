import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import {
  InventoryRow,
  PurchasesReportRow,
  SalesReportRow,
} from '../../core/models';

type ReportKey =
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'low-stock'
  | 'expiring';

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
  selector: 'app-reports',
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly inventoryRows = signal<InventoryRow[]>([]);
  protected readonly salesRows = signal<SalesReportRow[]>([]);
  protected readonly purchaseRows = signal<PurchasesReportRow[]>([]);

  protected selectedReport: ReportKey = 'inventory';
  protected fromDate = monthStart();
  protected toDate = dateToString(new Date());

  protected readonly reportOptions: { key: ReportKey; label: string }[] = [
    { key: 'inventory', label: 'Inventory' },
    { key: 'sales', label: 'Sales' },
    { key: 'purchases', label: 'Purchases' },
    { key: 'low-stock', label: 'Low stock' },
    { key: 'expiring', label: 'Expiring soon' },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected get reportTitle(): string {
    return (
      this.reportOptions.find((option) => option.key === this.selectedReport)
        ?.label ?? 'Report'
    );
  }

  protected get needsDateRange(): boolean {
    return this.selectedReport === 'sales' || this.selectedReport === 'purchases';
  }

  protected get hasRows(): boolean {
    if (this.selectedReport === 'inventory' || this.selectedReport === 'low-stock' || this.selectedReport === 'expiring') {
      return this.inventoryRows().length > 0;
    }
    if (this.selectedReport === 'sales') {
      return this.salesRows().length > 0;
    }
    return this.purchaseRows().length > 0;
  }

  protected get totalStockValue(): number {
    return this.inventoryRows().reduce(
      (sum, row) => sum + Number(row.stockValue ?? 0),
      0,
    );
  }

  protected get totalUnits(): number {
    return this.inventoryRows().reduce(
      (sum, row) => sum + Number(row.quantityInStock ?? 0),
      0,
    );
  }

  protected get salesTotals(): { salesCount: number; itemsSold: number; totalSales: number } {
    return this.salesRows().reduce(
      (totals, row) => ({
        salesCount: totals.salesCount + row.salesCount,
        itemsSold: totals.itemsSold + row.itemsSold,
        totalSales: totals.totalSales + row.totalSales,
      }),
      { salesCount: 0, itemsSold: 0, totalSales: 0 },
    );
  }

  protected get purchaseTotals(): { purchasesCount: number; itemsBought: number; totalCost: number } {
    return this.purchaseRows().reduce(
      (totals, row) => ({
        purchasesCount: totals.purchasesCount + row.purchasesCount,
        itemsBought: totals.itemsBought + row.itemsBought,
        totalCost: totals.totalCost + row.totalCost,
      }),
      { purchasesCount: 0, itemsBought: 0, totalCost: 0 },
    );
  }

  protected onReportChange(): void {
    if (this.needsDateRange && (!this.fromDate || !this.toDate)) {
      this.fromDate = monthStart();
      this.toDate = dateToString(new Date());
    }
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.inventoryRows.set([]);
    this.salesRows.set([]);
    this.purchaseRows.set([]);

    if (this.selectedReport === 'inventory') {
      this.fetchList<InventoryRow>('/api/reports/inventory', (rows) =>
        this.inventoryRows.set(rows),
      );
      return;
    }
    if (this.selectedReport === 'low-stock') {
      this.fetchList<InventoryRow>('/api/reports/low-stock', (rows) =>
        this.inventoryRows.set(rows),
      );
      return;
    }
    if (this.selectedReport === 'expiring') {
      this.fetchList<InventoryRow>('/api/reports/expiring?days=90', (rows) =>
        this.inventoryRows.set(rows),
      );
      return;
    }

    let params = new HttpParams();
    if (this.fromDate) {
      params = params.set('from', this.fromDate);
    }
    if (this.toDate) {
      params = params.set('to', this.toDate);
    }

    if (this.selectedReport === 'sales') {
      this.fetchList<SalesReportRow>(
        '/api/reports/sales',
        (rows) => this.salesRows.set(rows),
        params,
      );
      return;
    }
    this.fetchList<PurchasesReportRow>(
      '/api/reports/purchases',
      (rows) => this.purchaseRows.set(rows),
      params,
    );
  }

  private fetchList<T>(
    url: string,
    apply: (rows: T[]) => void,
    params?: HttpParams,
  ): void {
    this.http.get<T[]>(url, params ? { params } : undefined).subscribe({
      next: (rows) => {
        apply(rows);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(apiErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected printReport(): void {
    window.print();
  }
}
