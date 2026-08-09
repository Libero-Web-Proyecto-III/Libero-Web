import { Column, CreateDateColumn, DeleteDateColumn, Generated, PrimaryColumn, UpdateDateColumn } from "typeorm";


export class BaseEntity {

    @PrimaryColumn()
    index: number;

    @Column({
        unique: true
    })
    @Generated('uuid')
    uuid: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
            
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
            
    @DeleteDateColumn({ type: 'timestamp'})
    deletedAt: Date;
}