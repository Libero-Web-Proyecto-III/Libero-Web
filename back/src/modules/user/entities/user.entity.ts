import { ApiHideProperty } from "@nestjs/swagger";
import { EventEntity } from "src/modules/event/entities/event.entity";
import { PublicationEntity } from "src/modules/publication/entities/publication.entity";
import { RolEntity } from "src/modules/rol/entities/rol.entity";
import { TagEntity } from "src/modules/tag/entities/tag.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Generated, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity('user')
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

    @Column({ nullable: true })
    avatar: string;

    @JoinColumn({ name: 'rol' })
    @ManyToOne( ()  => RolEntity, (rol) => rol.users)
    rol: RolEntity;

    @JoinColumn({ name: 'tag' })
    @ManyToOne( () => TagEntity, (tag) => tag.users, {
        nullable: true
    })
    tag?: TagEntity | null;

        
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
        
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
        
    @DeleteDateColumn({ type: 'timestamp'})
    deletedAt: Date;


    //////////////////

    @ApiHideProperty()
    @OneToMany( () => EventEntity, (event) => event.organizer)
    events: EventEntity[];

    @ApiHideProperty()
    @OneToMany( () => PublicationEntity, (publication) => publication.author)
    publications: PublicationEntity[];

}
