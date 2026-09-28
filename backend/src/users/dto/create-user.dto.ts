import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(['Admin', 'Attendant'])
  role: string;
}
