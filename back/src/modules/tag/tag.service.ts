import { Injectable } from '@nestjs/common';
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
    return this.tagRepository.save(newTag);
  }

  async findAll(): Promise<TagEntity[]> {
    return this.tagRepository.find();
  }

  async findOne(id: number): Promise<TagEntity | null> {
    return this.tagRepository.findOneBy({ id });
  }

  async update(id: number, updateTagDto: UpdateTagDto): Promise<TagEntity | null> {
    return this.tagRepository.save({ id, ...updateTagDto });
  }

  async remove(id: number): Promise<void> {
    return this.tagRepository.delete(id).then(() => undefined);
  }
}
