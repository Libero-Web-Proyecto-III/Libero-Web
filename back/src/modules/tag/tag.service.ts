import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagEntity } from './entities/tag.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>
  ) {}

  async create(createTagDto: CreateTagDto): Promise<TagEntity> {
    const newTag = this.tagRepository.create(createTagDto) 
    const tagExists = await this.tagRepository.findOneBy({ name: newTag.name });
    if (tagExists) {
      throw new Error('Tag with this name already exists');
    }
    return this.tagRepository.save(newTag);
  }

  async findAll(): Promise<TagEntity[]> {
    return this.tagRepository.find();
  }

  async findOne(id: number): Promise<TagEntity | null> {
    return this.tagRepository.findOneBy({ id });
  }

  async update(id: number, updateTagDto: UpdateTagDto): Promise<TagEntity | null> {
    const tag = await this.findOne(id);
    if (!tag) throw new NotFoundException('No existe ese TAG');
    const tagExists = await this.tagRepository.findOneBy({ name: updateTagDto.name });
    if (tagExists && tagExists.id !== id) {
      throw new ConflictException('Ya existe un TAG con ese nombre');
    }
    return this.tagRepository.save({ id, ...updateTagDto });
  }

  async delete(id: number): Promise<{ tag: TagEntity | null, message: string }> {
    const tag = await this.findOne( id );
    if (!tag) throw new NotFoundException( 'No existe ese TAG' );
    return {
          message: 'Tag eliminado correctamente',
          tag: await this.tagRepository.softRemove(tag)
    }
   }
  async recover(id: number): Promise<TagEntity | null> {
    const tag = await this.tagRepository.findOne({
              where: { id },
              withDeleted: true
          });
  
    if (!tag) throw new NotFoundException( 'No existe ese TAG' );
    if (!tag.deletedAt) throw new ConflictException( 'El TAG no ha sido eliminado' )
    return await this.tagRepository.recover(tag)
    }
  }

