import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { dateFilter } from '../common/date-filter';
import { CountersService } from '../counters/counters.service';
import { Product } from '../products/schemas/product.schema';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { Purchase } from './schemas/purchase.schema';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectModel(Purchase.name)
    private readonly purchaseModel: Model<Purchase>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectConnection() private readonly connection: Connection,
    private readonly counters: CountersService,
  ) {}

  async findAll(from?: string, to?: string, supplierId?: string) {
    const filter: any = dateFilter('purchaseDate', from, to);
    if (supplierId && Types.ObjectId.isValid(supplierId)) {
      filter.supplier = new Types.ObjectId(supplierId);
    }
    return this.purchaseModel
      .find(filter)
      .populate('supplier', 'supplierName')
      .populate('items.product', 'productName brand')
      .populate('recordedBy', 'fullName')
      .sort({ purchaseDate: -1, purchaseNumber: -1 })
      .lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Purchase not found.');
    }
    const purchase = await this.purchaseModel
      .findById(id)
      .populate('supplier', 'supplierName')
      .populate('items.product', 'productName brand')
      .populate('recordedBy', 'fullName');
    if (!purchase) throw new NotFoundException('Purchase not found.');
    return purchase;
  }

  async create(dto: CreatePurchaseDto, userId: string) {
    const supplier = await this.connection
      .collection('suppliers')
      .findOne({ _id: new Types.ObjectId(dto.supplierId) });
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .select('productName');
    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = productIds.find((id) => !found.has(id));
      throw new NotFoundException(
        `Product not found for id ${missing ?? ''}. Please refresh the page.`,
      );
    }

    const purchaseNumber = await this.counters.next('purchase');
    const session = await this.connection.getClient().startSession();
    try {
      let purchase: any;
      await session.withTransaction(async () => {
        let total = 0;
        for (const line of dto.items) {
          await this.productModel.updateOne(
            { _id: line.productId },
            {
              $inc: { quantityInStock: line.quantity },
              $set: { costPrice: line.unitCost },
            },
            { session },
          );
          total += line.quantity * line.unitCost;
        }
        [purchase] = await this.purchaseModel.create(
          [
            {
              purchaseNumber,
              supplier: dto.supplierId,
              purchaseDate: new Date(dto.purchaseDate),
              items: dto.items.map((line) => ({
                product: line.productId,
                quantity: line.quantity,
                unitCost: line.unitCost,
              })),
              totalCost: total,
              recordedBy: userId,
            },
          ],
          { session },
        );
      });
      return this.findById(purchase.id);
    } finally {
      await session.endSession();
    }
  }
}
