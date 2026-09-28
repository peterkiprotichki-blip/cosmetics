import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/auth.decorator';
import { SupplierDto } from './dto/supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  findAll() {
    return this.suppliers.findAll();
  }

  @Post()
  @Roles('Admin')
  create(@Body() dto: SupplierDto) {
    return this.suppliers.create(dto);
  }

  @Put(':id')
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: SupplierDto) {
    return this.suppliers.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.suppliers.remove(id);
  }
}
