import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReqUser } from '../common/decorators/req-user.decorator';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get()
  findAll(@Query('from') from?: string, @Query('to') to?: string) {
    return this.sales.findAll(from, to);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.sales.findById(id);
  }

  @Post()
  create(@Body() dto: CreateSaleDto, @ReqUser() user: any) {
    return this.sales.create(dto, user.sub);
  }
}
