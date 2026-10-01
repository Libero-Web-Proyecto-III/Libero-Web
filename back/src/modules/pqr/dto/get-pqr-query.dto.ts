import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GetAllQueryDto } from 'src/common/dto/get-all.dto';
import { enumPqrType } from '../../../common/enums/pqr-type.enum';
import { enumPqrStatus } from '../../../common/enums/pqr-status.enum';

export class GetPqrQueryDto extends GetAllQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por tipo de PQR', enum: enumPqrType })
  @IsOptional()
  @IsEnum(enumPqrType)
  type?: enumPqrType;

  @ApiPropertyOptional({ description: 'Filtrar por estado', enum: enumPqrStatus })
  @IsOptional()
  @IsEnum(enumPqrStatus)
  status?: enumPqrStatus;
}