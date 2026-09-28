import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsMongoId,
  Min,
  ValidateNested,
} from 'class-validator';

export class SaleItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1, { message: 'Please enter a valid value greater than zero.' })
  quantity: number;
}

export class CreateSaleDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Select at least one product.' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
