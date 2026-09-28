import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async findAll(search?: string) {
    const filter: any = {};
    const term = search?.trim();
    if (term) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const categories = await this.connection
        .collection('categories')
        .find({ categoryName: regex })
        .project({ _id: 1 })
        .toArray();
      filter.$or = [
        { productName: regex },
        { brand: regex },
        { category: { $in: categories.map((c) => c._id) } },
      ];
    }
    return this.productModel
      .find(filter)
      .populate('category', 'categoryName')
      .sort({ productName: 1 })
      .lean();
  }

  async findById(id: string) {
    this.assertId(id);
    const product = await this.productModel
      .findById(id)
      .populate('category', 'categoryName');
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  async create(dto: CreateProductDto) {
    await this.assertCategory(dto.category);
    const created = await this.productModel.create({
      ...dto,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    });
    return this.findById(created.id);
  }

  async update(id: string, dto: UpdateProductDto) {
    this.assertId(id);
    if (dto.category) await this.assertCategory(dto.category);
    const update: any = { ...dto };
    if ('expiryDate' in dto) {
      update.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    }
    const product = await this.productModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!product) throw new NotFoundException('Product not found.');
    return this.findById(id);
  }

  private async assertCategory(categoryId: string) {
    const category = await this.connection
      .collection('categories')
      .findOne({ _id: new Types.ObjectId(categoryId) });
    if (!category) throw new NotFoundException('Category not found.');
  }

  private assertId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Product not found.');
    }
  }
}
