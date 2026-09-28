import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/auth.decorator';
import { ReqUser } from '../common/decorators/req-user.decorator';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.purchases.findAll(from, to, supplierId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.purchases.findById(id);
  }

  @Post()
  create(@Body() dto: CreatePurchaseDto, @ReqUser() user: any) {
    return this.purchases.create(dto, user.sub);
  }
}
