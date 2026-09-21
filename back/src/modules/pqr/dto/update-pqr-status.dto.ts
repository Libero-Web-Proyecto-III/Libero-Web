import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { enumPqrStatus } from '../../../common/enums/pqr-status.enum';

export class UpdatePqrStatusDto {
  @ApiProperty({ description: 'Nuevo estado de la PQR', enum: enumPqrStatus, example: enumPqrStatus.EN_REVISION })
  @IsEnum(enumPqrStatus)
  status!: enumPqrStatus;

  @ApiPropertyOptional({ description: 'Respuesta de la empresa (opcional al cambiar el estado)', example: 'Hemos revisado su caso...' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  response?: string;
}