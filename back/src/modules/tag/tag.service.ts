import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagEntity } from './entities/tag.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TagService implements OnModuleInit {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>
  ) {}

  async onModuleInit() {
    try {
      const indexes: any[] = await this.tagRepository.query('SHOW INDEX FROM `tag`');
      for (const idx of indexes) {
        if (idx.Column_name === 'color' && (idx.Non_unique == 0 || idx.Non_unique === '0')) {
          await this.tagRepository.query(`ALTER TABLE \`tag\` DROP INDEX \`${idx.Key_name}\``);
        }
      }
    } catch {
      // Ignorar si la tabla no existe o ya no tiene el índice
    }
  }

  async create(createTagDto: CreateTagDto): Promise<TagEntity> {
    const trimmedName = createTagDto.name.trim();
    const existingTag = await this.tagRepository.findOneBy({ name: trimmedName });

    if (existingTag) {
      throw new ConflictException('Ya existe una etiqueta con este nombre');
    }

    const newTag = this.tagRepository.create({
      ...createTagDto,
      name: trimmedName,
      color: createTagDto.color || '#7C3AED',
    });
    return this.tagRepository.save(newTag);
  }

  async findAll(): Promise<TagEntity[]> {
    return this.tagRepository.find();
  }

  async findByIds(ids: number[]): Promise<TagEntity[]> {
    if (!ids || ids.length === 0) return [];
    return this.tagRepository.findBy({ id: In(ids) });
  }

  async findOne(id: number): Promise<TagEntity | null> {
    return this.tagRepository.findOneBy({ id });
  }

  async update(id: number, updateTagDto: UpdateTagDto): Promise<TagEntity | null> {
    const tag = await this.findOne(id);
    if (!tag) throw new NotFoundException('No existe ese TAG');
    if (updateTagDto.name) {
      const trimmedName = updateTagDto.name.trim();
      const tagExists = await this.tagRepository.findOneBy({ name: trimmedName });
      if (tagExists && tagExists.id !== id) {
        throw new ConflictException('Ya existe un TAG con ese nombre');
      }
      updateTagDto.name = trimmedName;
    }
    return this.tagRepository.save({ id, ...updateTagDto });
  }

  async delete(id: number): Promise<{ message: string }> {
    const tag = await this.findOne(id);
    if (!tag) throw new NotFoundException('No existe ese TAG');

    // Desvincular de la tabla intermedia user_tags y de user.tag antes de eliminar
    try {
      await this.tagRepository.query('DELETE FROM `user_tags` WHERE `tagId` = ?', [id]);
    } catch {
      // Ignorar si ya se manejó por CASCADE a nivel de base de datos
    }
    try {
      await this.tagRepository.query('UPDATE `user` SET `tag` = NULL WHERE `tag` = ?', [id]);
    } catch {
      // Ignorar
    }

    // Eliminación física directa de la base de datos (Hard Delete)
    await this.tagRepository.delete(id);

    return {
      message: 'Tag eliminado permanentemente de la base de datos',
    };
  }

  async recover(id: number): Promise<{ message: string }> {
    return { message: 'Las etiquetas eliminadas se borran permanentemente de la base de datos' };
  }
}

