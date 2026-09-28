import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

@Schema()
export class Supplier {
  @Prop({ required: true, trim: true, maxlength: 80 })
  supplierName: string;

  @Prop({ trim: true, maxlength: 15 })
  phone?: string;

  @Prop({ trim: true, match: /^\S+@\S+\.\S+$/ })
  email?: string;

  @Prop({ trim: true, maxlength: 60 })
  location?: string;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
