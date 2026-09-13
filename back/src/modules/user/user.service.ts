import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity, UserEntityRelations } from './entities/user.entity';
import { FindOptionsRelations, ILike, Repository } from 'typeorm';
import { GetAllUserQueryDto } from './dto/get-user.dto';
import { AllResponse } from 'src/common/interface/res-all.dto';
import { CreateUserDto } from './dto/create-user.dto';
import bcrypt from 'bcrypt';
import { RolService } from '../rol/rol.service';
import { enumRol } from 'src/common/enums/rol.enum';
import { TagService } from '../tag/tag.service';


@Injectable()
export class UserService {

  constructor(

    @InjectRepository(UserEntity)
    private readonly UserRepository: Repository<UserEntity>,

    private readonly RolRepository: RolService,
    private readonly TagRepository: TagService,

  ) {}

  // # Este bloque tiene como objetivo listar a todos los usuarios paginados incluyendo sus relaciones de rol y tag
  async findAll(query: GetAllUserQueryDto): Promise<AllResponse> {
    const { include, page = 1, limit = 10 } = query;

    const skip = (page - 1) * limit;

    const [data, total] = await this.UserRepository.findAndCount({
      skip,
      take: limit,
      relations: UserEntityRelations as FindOptionsRelations<UserEntity>,
      order: { index: 'ASC' },
    });

    return {
      data,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  findOneBy = {

    uuid: async (uuid: string): Promise<UserEntity> => {
      const user = await this.UserRepository.findOne({
        where: { uuid },
        relations: UserEntityRelations as FindOptionsRelations<UserEntity>
      });

      if (!user) throw new NotFoundException('No se encontró este usuario por UUID');

      return user;
    },

    name: async (name: string): Promise<UserEntity> => {
      const user = await this.UserRepository.findOne({
        where: { name },
        relations: UserEntityRelations as FindOptionsRelations<UserEntity>
      });

      if (!user) throw new NotFoundException('No se encontró este usuario por NAME');
      

      return user;
    },

    email: async (email: string): Promise<UserEntity> => {
      const user = await this.UserRepository.findOne({
        where: { email },
        relations: UserEntityRelations as FindOptionsRelations<UserEntity>
      });

      if (!user) throw new NotFoundException('No se encontró este usuario por EMAIL');

      return user;
    },

  };

  findOrNull = {

    uuid: async (uuid: string): Promise<UserEntity | null> => {
      return await this.UserRepository.findOne({
        where: { uuid },
        relations: UserEntityRelations as FindOptionsRelations<UserEntity>
      });
    },


    name: async (name: string): Promise<UserEntity|null> => {
      const user = await this.UserRepository.findOne({
        where: { name },
        relations: UserEntityRelations as FindOptionsRelations<UserEntity>
      });

      return user;
    },

    email: async (email: string): Promise<UserEntity|null> => {
      const user = await this.UserRepository.findOne({
        where: { email },
        relations: UserEntityRelations as FindOptionsRelations<UserEntity>
      });

      return user;
    },


  };

  async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    return await this.UserRepository.findOne({
      where: [{ name: identifier }, { email: identifier }],
      relations: UserEntityRelations as FindOptionsRelations<UserEntity>,
    });
  }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {

    const { name, password, rol, tag, ...newData } = createUserDto;

    const newUserData: Partial<UserEntity> = { ...newData };

    const [ findRol, findTag, findUser ] = await Promise.all([
      this.RolRepository.findOne( enumRol.USER ),
      tag ? this.TagRepository.findOne( tag ) : null,
      this.UserRepository.findOneBy({ name })
    ])

    if (findUser) throw new ConflictException( 'Ya existe un usuario con ese nombre' );

    newUserData.rol = findRol
    newUserData.tag = findTag
    newUserData.name = name;
    newUserData.password = await bcrypt.hash(password, 10);

    const newUser = this.UserRepository.create(newUserData);

    return await this.UserRepository.save(newUser);
  }

  async delete(uuid: string) {

    const contact = await this.findOneBy.uuid(uuid);

    return {
      message: 'Usuario ELIMINADO',
      user: await this.UserRepository.softRemove(contact),
    };
  }

  // # Este bloque tiene como objetivo cambiar el rol de un usuario existente (ej. promover de usuario a admin) por parte de un Administrador
  async updateRole(uuid: string, roleName: enumRol): Promise<UserEntity> {
    const user = await this.findOneBy.uuid(uuid);
    const newRole = await this.RolRepository.findOne(roleName);
    if (!newRole) {
      throw new NotFoundException(`El rol ${roleName} no existe.`);
    }
    user.rol = newRole;
    return await this.UserRepository.save(user);
  }

  // # Este bloque tiene como objetivo actualizar la información básica de un usuario (nombre, correo) por el Administrador
  async update(uuid: string, updateData: { name?: string; email?: string }): Promise<UserEntity> {
    const user = await this.findOneBy.uuid(uuid);
    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    return await this.UserRepository.save(user);
  }

  async recover(uuid: string) {

    const user = await this.UserRepository.findOne({
      where: { uuid },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('No existe ese USUARIO');
    }

    if (!user.deletedAt) {
      throw new ConflictException(
        'El usuario no ha sido eliminado aun',
      );
    }

    return await this.UserRepository.recover(user);
  }

}