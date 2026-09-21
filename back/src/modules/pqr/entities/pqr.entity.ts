import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { enumPqrType } from '../../../common/enums/pqr-type.enum';
import { enumPqrStatus } from '../../../common/enums/pqr-status.enum';

@Entity('pqr')
export class PqrEntity extends BaseEntity {
  @ApiProperty({ description: 'Nombre completo de quien envía la PQR', example: 'Ana María Rojas' })
  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @ApiProperty({ description: 'Correo de contacto', example: 'ana@example.com' })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '3001234567' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Tipo de PQR', enum: enumPqrType, example: enumPqrType.PETICION })
  @Column({ type: 'enum', enum: enumPqrType })
  type: enumPqrType;

  @ApiProperty({ description: 'Asunto breve', example: 'Ruido de maquinaria en horario nocturno' })
  @Column({ type: 'varchar', length: 200 })
  subject: string;

  @ApiProperty({ description: 'Descripción detallada', example: 'Desde hace una semana...' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Estado de gestión de la PQR', enum: enumPqrStatus, example: enumPqrStatus.PENDIENTE })
  @Column({ type: 'enum', enum: enumPqrStatus, default: enumPqrStatus.PENDIENTE })
  status: enumPqrStatus;

  @ApiPropertyOptional({ description: 'Respuesta de la empresa a la PQR', example: 'Hemos revisado su caso...' })
  @Column({ type: 'text', nullable: true })
  response: string | null;

  @ApiPropertyOptional({ description: 'Fecha en la que se respondió la PQR', example: '2026-09-01T10:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date | null;
}