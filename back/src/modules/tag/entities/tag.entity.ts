import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserEntity } from 'src/modules/user/entities/user.entity';

@Entity('tag')
export class TagEntity {
    @ApiProperty({ example: 1, description: 'Identificador del tag' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'frontend', description: 'Nombre del tag' })
    @Column({ unique: true })
    name: string;

    @ApiProperty({ example: '#ffffff', description: 'Color del tag en formato hexadecimal' })
    @Column( { unique: true, default: '#ffffff' } )
    color: string;

    @ApiProperty({
        example: '2026-08-08T12:00:00.000Z',
        description: 'Fecha en la que el tag fue eliminado lógicamente',
        required: false,
        nullable: true,
        type: String,
        format: 'date-time',
    })
    @DeleteDateColumn({ type: 'timestamp', name: 'deletedAt' })
    deletedAt: Date;

    @ApiProperty({
        example: '2026-08-08T12:00:00.000Z',
        description: 'Fecha de creación del tag',
        type: String,
        format: 'date-time',
    })
    @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
    createdAt: Date;

    @ApiProperty({
        example: '2026-08-08T12:00:00.000Z',
        description: 'Fecha de última actualización del tag',
        type: String,
        format: 'date-time',
    })
    @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })    
    updatedAt: Date;

    @ApiHideProperty()
    @Exclude()
    @OneToMany( () => UserEntity, (user) => user.tag )
    users: UserEntity[];
}
