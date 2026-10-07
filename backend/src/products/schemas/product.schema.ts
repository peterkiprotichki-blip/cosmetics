import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true, maxlength: 80 })
  productName: string;

  @Prop({ trim: true, maxlength: 50 })
  brand?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  costPrice: number;

  @Prop({ required: true, min: 0, default: 0 })
  quantityInStock: number;

  @Prop({ min: 0, default: 5 })
  reorderLevel: number;

  @Prop()
  expiryDate?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ productName: 1 });
