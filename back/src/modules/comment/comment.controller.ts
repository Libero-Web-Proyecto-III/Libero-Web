import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { GetCommentQueryDto } from './dto/get-comment-query.dto';
import { CommentEntity } from './entities/comment.entity';

// NOTA: igual que en publication.controller.ts, se usa @Req() req.user
// como autor. Cuando el equipo tenga listo el módulo de autenticación
// (guard que llene req.user), esto queda funcionando sin cambios.
@ApiTags('comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar comentarios (opcionalmente filtrando por publicación)',
    description:
      'Devuelve un listado paginado de comentarios ordenados por fecha de creación descendente. ' +
      'Se puede filtrar por publicación enviando el query param `publicationUuid`. ' +
      'Cada comentario incluye la información del autor y de la publicación relacionada.',
  })
  @ApiOkResponse({
    description: 'Listado paginado de comentarios obtenido correctamente.',
    schema: {
      example: {
        data: [
          {
            index: 1,
            uuid: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
            content: 'Muy buen post!',
            author: {
              index: 5,
              uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              name: 'Juan Pérez',
            },
            publication: {
              index: 2,
              uuid: '9c858901-8a57-4791-81fe-4c455b099bc9',
              title: 'Mi primera publicación',
            },
            createdAt: '2026-08-01T14:32:00.000Z',
            updatedAt: '2026-08-01T14:32:00.000Z',
          },
        ],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      },
    },
  })
  findAll(@Query() query: GetCommentQueryDto) {
    return this.commentService.findAll(query);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: 'Obtener un comentario por uuid',
    description: 'Retorna un único comentario junto con su autor y la publicación a la que pertenece.',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID público del comentario',
    example: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  })
  @ApiOkResponse({
    description: 'Comentario encontrado.',
    type: CommentEntity,
  })
  @ApiNotFoundResponse({
    description: 'No existe ningún comentario con el uuid indicado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontró este comentario',
        error: 'Not Found',
      },
    },
  })
  findOne(@Param('uuid') uuid: string) {
    return this.commentService.findOneBy.uuid(uuid);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear un comentario en una publicación',
    description:
      'Crea un nuevo comentario asociado a la publicación indicada en `publicationUuid`. ' +
      'El autor se toma del usuario autenticado (`req.user`). ' +
      'Un mismo usuario puede comentar varias veces sobre la misma publicación, no hay restricción de unicidad.',
  })
  @ApiBody({ type: CreateCommentDto })
  @ApiOkResponse({
    description: 'Comentario creado exitosamente.',
    schema: {
      example: {
        index: 10,
        uuid: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
        content: 'Muy buen post!',
        author: { index: 5, uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
        publication: { index: 2, uuid: '9c858901-8a57-4791-81fe-4c455b099bc9' },
        createdAt: '2026-08-08T10:00:00.000Z',
        updatedAt: '2026-08-08T10:00:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No existe la publicación que se intenta comentar.',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontró la publicación a comentar',
        error: 'Not Found',
      },
    },
  })
  create(@Body() dto: CreateCommentDto, @Req() req: any) {
    return this.commentService.create(dto, req.user);
  }

  @Patch(':uuid')
  @ApiOperation({
    summary: 'Editar un comentario (solo el autor puede hacerlo)',
    description:
      'Permite modificar el contenido de un comentario existente. ' +
      'No se puede cambiar la publicación asociada, solo el texto. ' +
      'Solo el autor original del comentario puede editarlo.',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID público del comentario a editar',
    example: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  })
  @ApiBody({ type: UpdateCommentDto })
  @ApiOkResponse({
    description: 'Comentario actualizado correctamente.',
    schema: {
      example: {
        index: 10,
        uuid: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
        content: 'Muy buen post! (editado)',
        updatedAt: '2026-08-08T10:15:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No existe ningún comentario con el uuid indicado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontró este comentario',
        error: 'Not Found',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no es el autor del comentario.',
    schema: {
      example: {
        statusCode: 403,
        message: 'No puedes editar un comentario que no es tuyo',
        error: 'Forbidden',
      },
    },
  })
  update(@Param('uuid') uuid: string, @Body() dto: UpdateCommentDto, @Req() req: any) {
    return this.commentService.update(uuid, dto, req.user);
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: 'Eliminar (soft delete) un comentario (solo el autor)',
    description:
      'Elimina lógicamente un comentario (soft delete, se conserva en base de datos con `deletedAt` establecido). ' +
      'Solo el autor original del comentario puede eliminarlo.',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID público del comentario a eliminar',
    example: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  })
  @ApiOkResponse({
    description: 'Comentario eliminado (soft delete) correctamente.',
    schema: {
      example: {
        message: 'Comentario ELIMINADO',
        comment: {
          index: 10,
          uuid: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
          content: 'Muy buen post!',
          deletedAt: '2026-08-08T10:20:00.000Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No existe ningún comentario con el uuid indicado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontró este comentario',
        error: 'Not Found',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no es el autor del comentario.',
    schema: {
      example: {
        statusCode: 403,
        message: 'No puedes eliminar un comentario que no es tuyo',
        error: 'Forbidden',
      },
    },
  })
  remove(@Param('uuid') uuid: string, @Req() req: any) {
    return this.commentService.remove(uuid, req.user);
  }
}
