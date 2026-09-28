import { Transform } from 'class-transformer';
import {
  IsBoolean,
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

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  productName?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(50)
  brand?: string;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Please enter a valid value greater than zero.' })
  @Min(0.01, { message: 'Please enter a valid value greater than zero.' })
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Please enter a valid value greater than zero.' })
  costPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Please enter a valid value greater than zero.' })
  quantityInStock?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Please enter a valid value greater than zero.' })
  reorderLevel?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString({}, { message: 'Please enter a valid expiry date.' })
  expiryDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
