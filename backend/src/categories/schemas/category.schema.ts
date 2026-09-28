import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema()
export class Category {
  @Prop({ required: true, unique: true, trim: true, maxlength: 50 })
  categoryName: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
