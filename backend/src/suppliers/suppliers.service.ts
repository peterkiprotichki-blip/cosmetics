import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { SupplierDto } from './dto/supplier.dto';
import { Supplier } from './schemas/supplier.schema';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<Supplier>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  findAll() {
    return this.supplierModel.find().sort({ supplierName: 1 }).lean();
  }

  async create(dto: SupplierDto) {
    return this.supplierModel.create(dto);
  }

  async update(id: string, dto: SupplierDto) {
    this.assertId(id);
    const supplier = await this.supplierModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return supplier;
  }

  async remove(id: string) {
    this.assertId(id);
    const inUse = await this.connection
      .collection('purchases')
      .countDocuments({ supplier: new Types.ObjectId(id) });
    if (inUse > 0) {
      throw new ConflictException(
        'This supplier is used by purchases and cannot be deleted.',
      );
    }
    const removed = await this.supplierModel.findByIdAndDelete(id);
    if (!removed) throw new NotFoundException('Supplier not found.');
  }

  private assertId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Supplier not found.');
    }
  }
}
