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
import { CategoriesService } from './categories.service';
import { CategoryDto } from './dto/category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findAll() {
    return this.categories.findAll();
  }

  @Post()
  @Roles('Admin')
  create(@Body() dto: CategoryDto) {
    return this.categories.create(dto);
  }

  @Put(':id')
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: CategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}
