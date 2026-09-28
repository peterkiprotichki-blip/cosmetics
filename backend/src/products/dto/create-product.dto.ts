import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  productName: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(50)
  brand?: string;

  @IsMongoId()
  category: string;

  @IsNumber({}, { message: 'Please enter a valid value greater than zero.' })
  @Min(0.01, { message: 'Please enter a valid value greater than zero.' })
  unitPrice: number;

  @IsNumber()
  @Min(0, { message: 'Please enter a valid value greater than zero.' })
  costPrice: number;

  @IsInt()
  @Min(0, { message: 'Please enter a valid value greater than zero.' })
  quantityInStock: number;

  @IsInt()
  @Min(0, { message: 'Please enter a valid value greater than zero.' })
  reorderLevel: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString({}, { message: 'Please enter a valid expiry date.' })
  expiryDate?: string;
}
