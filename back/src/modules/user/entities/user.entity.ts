import { Column, CreateDateColumn, DeleteDateColumn, Generated, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";



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
    role: string;

    @Column()
    tag: string;

        
    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;
        
    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;
        
    @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at' })
    deletedAt: Date;
}
