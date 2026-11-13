import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trim } from '../../../common/validators.js';

export class ComponentNameDto {
  @ApiProperty({
    example: 'Rice Allowance',
    maxLength: 100,
    description:
      'Unique among active components, ignoring case and surrounding spaces',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
