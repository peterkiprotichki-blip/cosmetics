import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/auth.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  dashboard() {
    return this.reports.dashboard();
  }

  @Get('inventory')
  @Roles('Admin')
  inventory() {
    return this.reports.inventory();
  }

  @Get('low-stock')
  @Roles('Admin')
  lowStock() {
    return this.reports.lowStock();
  }

  @Get('expiring')
  @Roles('Admin')
  expiring(@Query('days') days?: string) {
    return this.reports.expiring(days);
  }

  @Get('sales')
  @Roles('Admin')
  salesReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.salesReport(from, to);
  }

  @Get('purchases')
  @Roles('Admin')
  purchasesReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.purchasesReport(from, to);
  }
}
