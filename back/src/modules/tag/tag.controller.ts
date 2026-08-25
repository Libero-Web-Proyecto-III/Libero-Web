import { Body, Controller, Delete, Get, Param, Patch, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagEntity } from './entities/tag.entity';

@ApiTags('Tag')
@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un tag',
    description: 'Crea un nuevo tag para clasificar usuarios, publicaciones u otros recursos.',
  })
  @ApiBody({
    type: CreateTagDto,
    examples: {
      ejemploBasico: {
        summary: 'Tag de frontend',
        value: {
          name: 'frontend',
          color: '#7C3AED',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Tag creado correctamente',
    type: TagEntity,
  })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar tags',
    description: 'Devuelve todos los tags registrados en la base de datos.',
  })
  @ApiOkResponse({
    description: 'Listado de tags',
    type: TagEntity,
    isArray: true,
  })
  findAll() {
    return this.tagService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un tag por ID',
    description: 'Busca un tag específico usando su identificador numérico.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID del tag' })
  @ApiOkResponse({
    description: 'Tag encontrado',
    type: TagEntity,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un tag',
    description: 'Actualiza uno o varios campos de un tag existente.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID del tag' })
  @ApiBody({ type: UpdateTagDto })
  @ApiOkResponse({
    description: 'Tag actualizado correctamente',
    type: TagEntity,
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTagDto: UpdateTagDto) {
    return this.tagService.update(id, updateTagDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un tag',
    description: 'Elimina lógicamente un tag usando soft delete.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID del tag' })
  @ApiOkResponse({
    description: 'Tag eliminado correctamente',
  })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.delete(id);
  }

  @Patch('recover/:id')
  @ApiOperation({
    summary: 'Recuperar un tag eliminado',
    description: 'Restaura un tag que fue eliminado lógicamente.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID del tag' })
  @ApiOkResponse({
    description: 'Tag recuperado correctamente',
    type: TagEntity,
  })
  recover(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.recover(id);
  }
}
