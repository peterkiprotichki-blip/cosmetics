import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsMongoId,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1, { message: 'Please enter a valid value greater than zero.' })
  quantity: number;

  @IsNumber()
  @Min(0, { message: 'Please enter a valid value greater than zero.' })
  unitCost: number;
}

export class CreatePurchaseDto {
  @IsMongoId()
  supplierId: string;

  @IsDateString()
  purchaseDate: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Select at least one product.' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
