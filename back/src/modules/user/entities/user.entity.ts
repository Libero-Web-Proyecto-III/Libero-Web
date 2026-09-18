import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { BaseEntity } from "src/common/entities/base.entity";
import { enumProperty } from "src/common/enums/property.enum";
import { EventEntity } from "src/modules/event/entities/event.entity";
import { PublicationEntity } from "src/modules/publication/entities/publication.entity";
import { RolEntity } from "src/modules/rol/entities/rol.entity";
import { TagEntity } from "src/modules/tag/entities/tag.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, FindOptionsRelations } from "typeorm";


export const UserEntityRelations: FindOptionsRelations<UserEntity> = {
    tag: true,
    tags: true,
    rol: true,
};

@Entity('user')
export class UserEntity extends BaseEntity {


    @ApiProperty({
        description: 'El nombre del usuario',
        example: enumProperty.name
    })
    @Column({ type: 'varchar', length: 50 })
    name: string;

    @ApiProperty({
        description: 'El correo del usuario',
        example: enumProperty.email
    })
    @Column({ type: 'varchar', length: 255 })
    email: string;

    @ApiHideProperty()
    @Exclude()
    @Column()
    password: string;

    @ApiProperty({
        description: 'Dirección local o DNS de la imagen',
        example: enumProperty.avatar
    })
    @Column({ type: 'longtext', nullable: true })
    avatar: string;

    @ApiProperty({
        description: 'El rol de autorización del usuario',
        example: enumProperty.rol
    })
    @JoinColumn({ name: 'rol' })
    @ManyToOne( ()  => RolEntity, (rol) => rol.users)
    rol: RolEntity;

    @ApiProperty({
        description: 'Las etiquetas asignadas al usuario',
        type: () => [TagEntity]
    })
    @ManyToMany( () => TagEntity, (tag) => tag.users, { onDelete: 'CASCADE' } )
    @JoinTable({
        name: 'user_tags',
        joinColumn: { name: 'userIndex', referencedColumnName: 'index' },
        inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' }
    })
    tags?: TagEntity[];

    @ApiProperty({
        description: 'El tag ligado al usuario',
        example: enumProperty.tag
    })
    @JoinColumn({ name: 'tag' })
    @ManyToOne( () => TagEntity, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    tag?: TagEntity | null;



    //////////////////

    @ApiHideProperty()
    @OneToMany( () => EventEntity, (event) => event.organizer)
    events: EventEntity[];

    @ApiHideProperty()
    @OneToMany( () => PublicationEntity, (publication) => publication.author)
    publications: PublicationEntity[];

}
