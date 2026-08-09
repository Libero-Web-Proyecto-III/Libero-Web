import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({
    example: 'admin',
    description: 'Nombre único del rol',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(30)
  name!: string;
}