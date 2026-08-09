import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Generated,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { CommentEntity } from 'src/modules/comment/entities/comment.entity';
import { ReactionEntity } from 'src/modules/reaction/entities/reaction.entity';

@Entity('publication')
export class PublicationEntity {
  @ApiHideProperty()
  @PrimaryGeneratedColumn()
  index: number;

  @ApiProperty({
    description: 'Identificador único público de la publicación',
    example: 'f6e5d4c3-b2a1-4c3d-9e8f-7a6b5c4d3e2f',
  })
  @Column({ unique: true })
  @Generated('uuid')
  uuid: string;

  @ApiProperty({
    description: 'Usuario autor de la publicación',
    type: () => UserEntity,
  })
  @JoinColumn({ name: 'author' })
  @ManyToOne(() => UserEntity, (user) => user.publications, {
    nullable: true,
  })
  author: UserEntity;

  @ApiProperty({
    description: 'Título de la publicación',
    example: 'Lanzamos la nueva versión de ForgeHub',
  })
  @Column()
  title: string;

  @ApiPropertyOptional({
    description: 'Lista de URLs de media adjunta',
    example: ['https://cdn.forgehub.com/img1.png'],
    type: [String],
  })
  @Column('simple-array', { nullable: true })
  media: string[];

  @ApiProperty({
    description: 'Contenido de la publicación',
    example: 'Hoy compartimos los avances del proyecto y cómo pueden contribuir.',
  })
  @Column('text')
  content: string;

  @ApiHideProperty()
  @Exclude()
  @OneToMany(() => CommentEntity, (comment) => comment.publication)
  comments: CommentEntity[];

  @ApiHideProperty()
  @Exclude()
  @OneToMany(() => ReactionEntity, (reaction) => reaction.publication)
  reactions: ReactionEntity[];

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2026-08-08T14:30:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de la última actualización del registro',
    example: '2026-08-08T14:30:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Fecha de eliminación lógica (soft delete). Null si no ha sido eliminada.',
    example: null,
  })
  @DeleteDateColumn({ type: 'timestamp', name: 'deletedAt' })
  deletedAt: Date;
}