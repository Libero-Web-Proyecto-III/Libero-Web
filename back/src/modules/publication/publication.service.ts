import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicationEntity } from './entities/publication.entity';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { GetAllPublicationQueryDto } from './dto/get-publication-query.dto';
import { AllResponse } from 'src/common/interface/res-all.dto';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { enumRol } from 'src/common/enums/rol.enum';

@Injectable()
export class PublicationService {
  constructor(
    @InjectRepository(PublicationEntity)
    private readonly PublicationRepository: Repository<PublicationEntity>,
  ) { }

  async create(createPublicationDto: CreatePublicationDto, author: UserEntity & { id?: number }): Promise<PublicationEntity> {
    const newPublication = this.PublicationRepository.create({
      ...createPublicationDto,
      author: { index: author.id } as UserEntity,
    });
    return this.PublicationRepository.save(newPublication);
  }

  async findAll(query: GetAllPublicationQueryDto): Promise<AllResponse> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.PublicationRepository.findAndCount({
      relations: { author: { rol: true }, comments: true, reactions: true },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
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
    uuid: async (uuid: string): Promise<PublicationEntity> => {
      const publication = await this.PublicationRepository.findOne({
        where: { uuid },
        relations: { author: { rol: true }, comments: true, reactions: true },
      });

      if (!publication) throw new NotFoundException('No se encontró esta publicación por UUID');
      return publication;
    },
  };

  async update(uuid: string, updatePublicationDto: UpdatePublicationDto): Promise<PublicationEntity> {
    const publication = await this.findOneBy.uuid(uuid);
    return this.PublicationRepository.save({ index: publication.index, ...updatePublicationDto });
  }

  async remove(uuid: string, requester: { role: string }) {
    const publication = await this.findOneBy.uuid(uuid);
    const canDelete = requester.role === enumRol.ADMIN ||
      (requester.role === enumRol.MOD && publication.author?.rol?.name === enumRol.ADMIN);

    if (!canDelete) {
      throw new ForbiddenException('No tienes permiso para eliminar esta publicación');
    }

    return {
      message: 'Publicacion ELIMINADA',
      publication: await this.PublicationRepository.softRemove(publication),
    };
  }

  async recover(uuid: string) {
    const publication = await this.PublicationRepository.findOne({
      where: { uuid },
      withDeleted: true,
    });

    if (!publication) throw new NotFoundException('No existe esa PUBLICACION');
    if (!publication.deletedAt) throw new ConflictException('La publicacion no ha sido eliminada aun');

    return this.PublicationRepository.recover(publication);
  }
}