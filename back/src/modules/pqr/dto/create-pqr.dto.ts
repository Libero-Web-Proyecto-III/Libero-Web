import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { enumPqrType } from '../../../common/enums/pqr-type.enum';

export class CreatePqrDto {
  @ApiProperty({ description: 'Nombre completo', example: 'Ana María Rojas' })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(150, { message: 'El nombre no puede superar los 150 caracteres' })
  fullName!: string;

  @ApiProperty({ description: 'Correo de contacto', example: 'ana@example.com' })
  @IsEmail({}, { message: 'Debes ingresar un correo electrónico válido' })
  email!: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '3001234567' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto válido' })
  @MaxLength(20, { message: 'El teléfono no puede superar los 20 caracteres' })
  phone?: string;

  @ApiProperty({ description: 'Tipo de PQR', enum: enumPqrType, example: enumPqrType.PETICION })
  @IsEnum(enumPqrType, { message: 'El tipo debe ser: peticion, queja, reclamo o sugerencia' })
  type!: enumPqrType;

  @ApiProperty({ description: 'Asunto breve (mínimo 5 caracteres)', example: 'Ruido de maquinaria' })
  @IsString({ message: 'El asunto debe ser un texto válido' })
  @MinLength(5, { message: 'El asunto debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El asunto no puede superar los 200 caracteres' })
  subject!: string;

  @ApiProperty({ description: 'Descripción detallada (mínimo 10 caracteres)', example: 'Desde hace una semana...' })
  @IsString({ message: 'El mensaje debe ser un texto válido' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres' })
  message!: string;
}