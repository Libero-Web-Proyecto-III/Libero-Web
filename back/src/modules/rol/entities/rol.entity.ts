import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('rol')
export class RolEntity {

  @ApiProperty({ example: 1, description: 'Identificador del rol' })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ example: 'admin', description: 'Nombre del rol' })
  @Column({ unique: true })
  name!: string;

  @ApiHideProperty()
  @Exclude()
  @OneToMany( () => UserEntity, (user) => user.rol)
  users!: UserEntity[];

}