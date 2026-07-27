import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publication } from './entity/publication.entity';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PaginationDto } from './dto/pagination.dto';
import { User } from '../user/entity/user.entity';

@Injectable()
export class PublicationService {
  constructor(
    @InjectRepository(Publication)
    private readonly publicationRepo: Repository<Publication>,
  ) {}

  async create(dto: CreatePublicationDto, author: User): Promise<Publication> {
    const publication = this.publicationRepo.create({ ...dto, author });
    return this.publicationRepo.save(publication);
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const [data, total] = await this.publicationRepo.findAndCount({
      relations: ['author', 'comments', 'reactions'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Publication> {
    const publication = await this.publicationRepo.findOne({
      where: { id },
      relations: ['author', 'comments', 'reactions'],
    });
    if (!publication) {
      throw new NotFoundException(`Publicacion con id ${id} no encontrada`);
    }
    return publication;
  }

  async update(id: string, dto: UpdatePublicationDto): Promise<Publication> {
    const publication = await this.findOne(id);
    Object.assign(publication, dto);
    return this.publicationRepo.save(publication);
  }

  async remove(id: string): Promise<void> {
    const publication = await this.findOne(id);
    await this.publicationRepo.softDelete(publication.id);
  }
}