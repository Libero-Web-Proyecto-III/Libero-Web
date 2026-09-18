import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const newCategory = this.categoryRepository.create(dto);
    return this.categoryRepository.save(newCategory);
  }

  async findAll(): Promise<CategoryEntity[]> {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  findOneBy = {
    uuid: async (uuid: string): Promise<CategoryEntity> => {
      const category = await this.categoryRepository.findOne({ where: { uuid } });
      if (!category) throw new NotFoundException('No se encontró esta categoría');
      return category;
    },
  };

  async update(uuid: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.findOneBy.uuid(uuid);
    return this.categoryRepository.save({ index: category.index, ...dto });
  }

  async remove(uuid: string) {
    const category = await this.findOneBy.uuid(uuid);
    return {
      message: 'Categoría ELIMINADA',
      category: await this.categoryRepository.softRemove(category),
    };
  }
}