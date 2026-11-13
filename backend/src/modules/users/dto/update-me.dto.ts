import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Required when newPassword is sent' })
  @ValidateIf((dto: UpdateMeDto) => dto.newPassword !== undefined)
  @IsString()
  @IsNotEmpty()
  currentPassword?: string;

  @ApiPropertyOptional({ minLength: 8, maxLength: 72 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword?: string;
}
