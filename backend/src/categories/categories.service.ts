import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { CategoryDto } from './dto/category.dto';
import { Category } from './schemas/category.schema';

const DUPLICATE = 'This name already exists. Please use a different one.';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  findAll() {
    return this.categoryModel.find().sort({ categoryName: 1 }).lean();
  }

  async create(dto: CategoryDto) {
    try {
      return await this.categoryModel.create(dto);
    } catch (error) {
      if (error?.code === 11000) throw new ConflictException(DUPLICATE);
      throw error;
    }
  }

  async update(id: string, dto: CategoryDto) {
    this.assertId(id);
    try {
      const category = await this.categoryModel.findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
      });
      if (!category) throw new NotFoundException('Category not found.');
      return category;
    } catch (error) {
      if (error?.code === 11000) throw new ConflictException(DUPLICATE);
      throw error;
    }
  }

  async remove(id: string) {
    this.assertId(id);
    const inUse = await this.connection
      .collection('products')
      .countDocuments({ category: new Types.ObjectId(id) });
    if (inUse > 0) {
      throw new ConflictException(
        'This category is used by products and cannot be deleted.',
      );
    }
    const removed = await this.categoryModel.findByIdAndDelete(id);
    if (!removed) throw new NotFoundException('Category not found.');
  }

  private assertId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Category not found.');
    }
  }
}
