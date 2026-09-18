import { Column, Entity, OneToMany } from 'typeorm';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';
import { PublicationEntity } from 'src/modules/publication/entities/publication.entity';

@Entity('category')
export class CategoryEntity extends BaseEntity {
  @ApiProperty({ description: 'Nombre de la categoría', example: 'Comunidad' })
  @Column({ unique: true })
  name: string;

  @ApiPropertyOptional({ description: 'Color de la categoría en formato hexadecimal', example: '#f97316' })
  @Column({ default: '#71717a' })
  color: string;

  @ApiPropertyOptional({ description: 'Emoji representativo de la categoría', example: '👥' })
  @Column({ default: '📁' })
  icon: string;

  @ApiHideProperty()
  @Exclude()
  @OneToMany(() => PublicationEntity, (publication) => publication.category)
  publications: PublicationEntity[];
}