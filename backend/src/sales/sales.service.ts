import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { dateFilter } from '../common/date-filter';
import { CountersService } from '../counters/counters.service';
import { Product } from '../products/schemas/product.schema';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './schemas/sale.schema';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectConnection() private readonly connection: Connection,
    private readonly counters: CountersService,
  ) {}

  async findAll(from?: string, to?: string) {
    const filter = dateFilter('saleDate', from, to);
    return this.saleModel
      .find(filter)
      .populate('items.product', 'productName brand')
      .populate('servedBy', 'fullName')
      .sort({ saleDate: -1, saleNumber: -1 })
      .lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Sale not found.');
    }
    const sale = await this.saleModel
      .findById(id)
      .populate('items.product', 'productName brand')
      .populate('servedBy', 'fullName');
    if (!sale) throw new NotFoundException('Sale not found.');
    return sale;
  }

  async create(dto: CreateSaleDto, userId: string) {
    const saleNumber = await this.counters.next('sale');
    const session = await this.connection.getClient().startSession();
    try {
      let sale: any;
      await session.withTransaction(async () => {
        const items = [];
        let total = 0;
        for (const line of dto.items) {
          const product = await this.productModel
            .findOneAndUpdate(
              {
                _id: line.productId,
                isActive: true,
                quantityInStock: { $gte: line.quantity },
              },
              { $inc: { quantityInStock: -line.quantity } },
              { new: true, session },
            )
            .select('productName unitPrice quantityInStock isActive');
          if (!product) {
            const available = await this.productModel
              .findById(line.productId)
              .session(session);
            if (!available) {
              throw new BadRequestException(
                'Product not found. Please refresh the page and try again.',
              );
            }
            if (!available.isActive) {
              throw new BadRequestException(
                `${available.productName} is no longer available.`,
              );
            }
            throw new BadRequestException(
              `Insufficient stock for ${available.productName}. Available: ${available.quantityInStock}.`,
            );
          }
          items.push({
            product: product._id,
            quantity: line.quantity,
            unitPrice: product.unitPrice,
          });
          total += line.quantity * product.unitPrice;
        }
        [sale] = await this.saleModel.create(
          [{ saleNumber, items, totalAmount: total, servedBy: userId }],
          { session },
        );
      });
      return this.findById(sale.id);
    } finally {
      await session.endSession();
    }
  }
}
