import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PurchaseDocument = HydratedDocument<Purchase>;

@Schema({ _id: false })
export class PurchaseItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitCost: number;
}

export const PurchaseItemSchema = SchemaFactory.createForClass(PurchaseItem);

@Schema({ timestamps: true })
export class Purchase {
  @Prop({ required: true, index: true })
  purchaseNumber: number;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplier: Types.ObjectId;

  @Prop({ required: true })
  purchaseDate: Date;

  @Prop({ type: [PurchaseItemSchema], required: true })
  items: PurchaseItem[];

  @Prop({ required: true, min: 0 })
  totalCost: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recordedBy: Types.ObjectId;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
