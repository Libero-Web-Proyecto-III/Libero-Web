import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('visit')
export class VisitEntity {
  @ApiProperty({ example: 1, description: 'ID autoincremental de la visita' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: '/eventos', description: 'Ruta consultada' })
  @Index()
  @Column({ type: 'varchar', length: 255 })
  path: string;

  @ApiProperty({ example: 'a9b2c3d4-e5f6-7890', description: 'Identificador anónimo del visitante' })
  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  visitorId?: string;

  @ApiProperty({ example: 'https://google.com', description: 'Referencia o procedencia de la visita' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  referrer?: string;

  @ApiProperty({ example: 'Mozilla/5.0...', description: 'Navegador o agente de usuario básico' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  @ApiProperty({ example: '2026-09-13T17:30:00.000Z', description: 'Fecha y hora del registro' })
  @Index()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
