import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
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

    @DeleteDateColumn({ type: 'timestamp', name: 'deletedAt' })
    deletedAt: Date;

    @CreateDateColumn({ type: 'timestamp', name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })    
    updatedAt: Date;

    @ApiHideProperty()
    @Exclude()
    @OneToMany( () => UserEntity, (user) => user.tag )
    users: UserEntity[];
}
