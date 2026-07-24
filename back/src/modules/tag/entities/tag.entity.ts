import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserEntity } from 'src/modules/user/entities/user.entity';

@Entity('tag')
export class TagEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column( { unique: true, default: '#ffffff' } )
    color: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @ApiHideProperty()
    @Exclude()
    @OneToMany( () => UserEntity, (user) => user.rol)
    users: UserEntity[];
}
