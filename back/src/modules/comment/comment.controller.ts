import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { GetCommentQueryDto } from './dto/get-comment-query.dto';

// NOTA: igual que en publication.controller.ts, se usa @Req() req.user
// como autor. Cuando el equipo tenga listo el módulo de autenticación
// (guard que llene req.user), esto queda funcionando sin cambios.
@ApiTags('comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Listar comentarios (opcionalmente filtrando por publicación)' })
  findAll(@Query() query: GetCommentQueryDto) {
    return this.commentService.findAll(query);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Obtener un comentario por uuid' })
  findOne(@Param('uuid') uuid: string) {
    return this.commentService.findOneBy.uuid(uuid);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un comentario en una publicación' })
  create(@Body() dto: CreateCommentDto, @Req() req: any) {
    return this.commentService.create(dto, req.user);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: 'Editar un comentario (solo el autor puede hacerlo)' })
  update(@Param('uuid') uuid: string, @Body() dto: UpdateCommentDto, @Req() req: any) {
    return this.commentService.update(uuid, dto, req.user);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Eliminar (soft delete) un comentario (solo el autor)' })
  remove(@Param('uuid') uuid: string, @Req() req: any) {
    return this.commentService.remove(uuid, req.user);
  }
}
