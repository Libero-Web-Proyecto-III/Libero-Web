import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';

import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';
import { PRIVATE } from '../../common/decorator/private.decorator';
import { ROLES } from '../../common/decorator/roles.decorator';
import { enumRol } from '../../common/enums/rol.enum';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar categorías',
    description: 'Devuelve todas las categorías disponibles, ordenadas alfabéticamente.',
  })
  @ApiResponse({ status: 200, description: 'Listado de categorías' })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Obtener una categoría por UUID' })
  @ApiParam({ name: 'uuid', description: 'UUID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada', type: CategoryEntity })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  findOne(@Param('uuid') uuid: string) {
    return this.categoryService.findOneBy.uuid(uuid);
  }

  @PRIVATE()
  @ROLES([enumRol.MOD, enumRol.ADMIN])
  @Post()
  @ApiOperation({ summary: 'Crear una categoría', description: 'Solo moderadores o administradores.' })
  @ApiResponse({ status: 201, description: 'Categoría creada', type: CategoryEntity })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @PRIVATE()
  @ROLES([enumRol.MOD, enumRol.ADMIN])
  @Patch(':uuid')
  @ApiOperation({ summary: 'Actualizar una categoría', description: 'Solo moderadores o administradores.' })
  @ApiParam({ name: 'uuid', description: 'UUID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada', type: CategoryEntity })
  update(@Param('uuid') uuid: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(uuid, dto);
  }

  @PRIVATE()
  @ROLES([enumRol.MOD, enumRol.ADMIN])
  @Delete(':uuid')
  @ApiOperation({ summary: 'Eliminar una categoría', description: 'Elimina lógicamente la categoría.' })
  @ApiParam({ name: 'uuid', description: 'UUID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría eliminada' })
  remove(@Param('uuid') uuid: string) {
    return this.categoryService.remove(uuid);
  }
}