import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

export class SupplierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  supplierName: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(15)
  phone?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail({}, { message: 'Please enter a valid e-mail address.' })
  email?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(60)
  location?: string;
}
