import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/modules/user/entities/user.entity';

export type NotificationType = 'comment_moderation' | 'pqr_response' | 'general';

@Entity('notification')
export class NotificationEntity {
  @ApiProperty({ description: 'Llave primaria interna' })
  @PrimaryGeneratedColumn()
  index: number;

  @ApiProperty({ description: 'Identificador público UUID' })
  @Column({ unique: true })
  @Generated('uuid')
  uuid: string;

  @ApiProperty({ description: 'Usuario destinatario de la notificación', type: () => UserEntity })
  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userIndex', referencedColumnName: 'index' })
  user: UserEntity;

  @ApiProperty({ description: 'Moderador que ejecutó la acción', type: () => UserEntity, required: false })
  @ManyToOne(() => UserEntity, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'moderatorIndex', referencedColumnName: 'index' })
  moderator?: UserEntity | null;

  @ApiProperty({ description: 'Tipo de notificación', example: 'comment_moderation' })
  @Column({ type: 'varchar', length: 50, default: 'comment_moderation' })
  type: NotificationType;

  @ApiProperty({ description: 'Título de la notificación', example: 'Comentario eliminado por un moderador' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Contenido del comentario eliminado', example: 'Este es el texto que fue eliminado' })
  @Column({ type: 'text' })
  commentContent: string;

  @ApiProperty({ description: 'Motivo o razón de la moderación', example: 'Incumplimiento de normas comunitarias' })
  @Column({ type: 'text' })
  moderationReason: string;

  @ApiProperty({ description: 'Título de la publicación asociada', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  publicationTitle?: string | null;

  @ApiProperty({ description: 'UUID de la publicación asociada', required: false })
  @Column({ type: 'varchar', length: 64, nullable: true })
  publicationUuid?: string | null;

  @ApiProperty({ description: 'Indica si la notificación fue leída por el usuario', default: false })
  @Column({ type: 'boolean', default: false })
  read: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;

  @ApiProperty({ description: 'Fecha de expiración (3 días después de creación)' })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;
}
