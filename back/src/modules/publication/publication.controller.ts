import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { PublicationService } from './publication.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { GetAllPublicationQueryDto } from './dto/get-publication-query.dto';
import { PublicationEntity } from './entities/publication.entity';

@ApiTags('Publications')
@Controller('publications')
export class PublicationController {
  constructor(private readonly publicationService: PublicationService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar publicaciones',
    description: 'Devuelve un listado paginado de publicaciones junto con autor, comentarios y reacciones.',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de publicaciones' })
  findAll(@Query() query: GetAllPublicationQueryDto) {
    return this.publicationService.findAll(query);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: 'Obtener una publicación por UUID',
    description: 'Devuelve el detalle de una publicación específica.',
  })
  @ApiParam({ name: 'uuid', description: 'UUID de la publicación', example: 'f6e5d4c3-b2a1-4c3d-9e8f-7a6b5c4d3e2f' })
  @ApiResponse({ status: 200, description: 'Publicación encontrada', type: PublicationEntity })
  @ApiResponse({ status: 404, description: 'Publicación no encontrada' })
  findOne(@Param('uuid') uuid: string) {
    return this.publicationService.findOneBy.uuid(uuid);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear una publicación',
    description: 'Crea una nueva publicación asociada al usuario autenticado.',
  })
  @ApiResponse({ status: 201, description: 'Publicación creada exitosamente', type: PublicationEntity })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createPublicationDto: CreatePublicationDto, @Req() req: any) {
    return this.publicationService.create(createPublicationDto, req.user);
  }

  @Patch(':uuid')
  @ApiOperation({
    summary: 'Actualizar una publicación',
    description: 'Modifica los datos de una publicación existente (solo moderador o admin).',
  })
  @ApiParam({ name: 'uuid', description: 'UUID de la publicación', example: 'f6e5d4c3-b2a1-4c3d-9e8f-7a6b5c4d3e2f' })
  @ApiResponse({ status: 200, description: 'Publicación actualizada', type: PublicationEntity })
  @ApiResponse({ status: 404, description: 'Publicación no encontrada' })
  update(@Param('uuid') uuid: string, @Body() updatePublicationDto: UpdatePublicationDto) {
    return this.publicationService.update(uuid, updatePublicationDto);
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: 'Eliminar una publicación',
    description: 'Elimina lógicamente una publicación (soft delete).',
  })
  @ApiParam({ name: 'uuid', description: 'UUID de la publicación', example: 'f6e5d4c3-b2a1-4c3d-9e8f-7a6b5c4d3e2f' })
  @ApiResponse({ status: 200, description: 'Publicación eliminada' })
  @ApiResponse({ status: 404, description: 'Publicación no encontrada' })
  remove(@Param('uuid') uuid: string) {
    return this.publicationService.remove(uuid);
  }
}