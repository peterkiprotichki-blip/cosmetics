import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { dateFilter } from '../common/date-filter';
import { Product } from '../products/schemas/product.schema';
import { Purchase } from '../purchases/schemas/purchase.schema';
import { Sale } from '../sales/schemas/sale.schema';

const EXPIRING_WINDOW_DAYS = 90;

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
    @InjectModel(Purchase.name)
    private readonly purchaseModel: Model<Purchase>,
  ) {}

  async inventory() {
    const products = await this.productModel
      .find({ isActive: true })
      .populate('category', 'categoryName')
      .sort({ productName: 1 })
      .lean();
    return products.map((product: any) => this.toRow(product));
  }

  async lowStock() {
    const products = await this.productModel
      .find({
        isActive: true,
        $expr: { $lte: ['$quantityInStock', '$reorderLevel'] },
      })
      .populate('category', 'categoryName')
      .sort({ quantityInStock: 1 })
      .lean();
    return products.map((product: any) => this.toRow(product));
  }

  async expiring(days?: string | number) {
    const window = Math.min(Math.max(Number(days) || EXPIRING_WINDOW_DAYS, 1), 3650);
    const deadline = new Date(Date.now() + window * 24 * 60 * 60 * 1000);
    const products = await this.productModel
      .find({
        isActive: true,
        expiryDate: { $ne: null, $lte: deadline },
      })
      .populate('category', 'categoryName')
      .sort({ expiryDate: 1 })
      .lean();
    return products.map((product: any) => this.toRow(product));
  }

  async salesReport(from?: string, to?: string) {
    return this.saleModel.aggregate([
      { $match: dateFilter('saleDate', from, to) },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          saleIds: { $addToSet: '$_id' },
          itemsSold: { $sum: '$items.quantity' },
          totalSales: {
            $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          salesCount: { $size: '$saleIds' },
          itemsSold: 1,
          totalSales: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  async purchasesReport(from?: string, to?: string) {
    return this.purchaseModel.aggregate([
      { $match: dateFilter('purchaseDate', from, to) },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate' } },
          purchaseIds: { $addToSet: '$_id' },
          itemsBought: { $sum: '$items.quantity' },
          totalCost: {
            $sum: { $multiply: ['$items.quantity', '$items.unitCost'] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          purchasesCount: { $size: '$purchaseIds' },
          itemsBought: 1,
          totalCost: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  async dashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalProducts, lowStockRows, expiringRows, todayAgg] =
      await Promise.all([
        this.productModel.countDocuments({ isActive: true }),
        this.lowStock(),
        this.expiring(),
        this.saleModel.aggregate([
          { $match: { saleDate: { $gte: today } } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              amount: { $sum: '$totalAmount' },
            },
          },
        ]),
      ]);
    const todaySales = todayAgg[0] ?? { count: 0, amount: 0 };
    return {
      totalProducts,
      lowStockCount: lowStockRows.length,
      expiringCount: expiringRows.length,
      todaySalesCount: todaySales.count,
      todaySalesAmount: todaySales.amount,
      lowStock: lowStockRows.map((row) => ({
        _id: row._id,
        productName: row.productName,
        brand: row.brand,
        categoryName: row.categoryName,
        quantityInStock: row.quantityInStock,
        reorderLevel: row.reorderLevel,
      })),
    };
  }

  private toRow(product: any) {
    return {
      _id: product._id,
      productName: product.productName,
      brand: product.brand ?? '',
      categoryName: product.category?.categoryName ?? '',
      quantityInStock: product.quantityInStock,
      unitPrice: product.unitPrice,
      costPrice: product.costPrice,
      reorderLevel: product.reorderLevel,
      expiryDate: product.expiryDate ?? null,
      isActive: product.isActive,
      stockValue: product.quantityInStock * product.costPrice,
    };
  }
}
