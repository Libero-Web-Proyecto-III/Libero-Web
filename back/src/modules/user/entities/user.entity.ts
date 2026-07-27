import { RolEntity } from "src/modules/rol/entities/rol.entity";
import { TagEntity } from "src/modules/tag/entities/tag.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Generated, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";



export class UserEntity {


    @PrimaryGeneratedColumn()
    index: number;

    @PrimaryColumn()
    @Generated('uuid')
    uuid: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    avatar: string;

    @Column()
    @ManyToOne( ()  => RolEntity, (rol) => rol.users)
    rol: RolEntity;

    @Column({ nullable: true })
    @ManyToOne( () => TagEntity, (tag) => tag.users)
    tag?: TagEntity | null;

        
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
        
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
        
    @DeleteDateColumn({ type: 'timestamp'})
    deletedAt: Date;
}
