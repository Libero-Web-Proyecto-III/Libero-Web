import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ReactionService } from './reaction.service';
import { CreateReactionDto } from './dto/create-reaction.dto';

@ApiTags('reactions')
@Controller('reactions')
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @Post()
  @ApiOperation({
    summary: 'Reaccionar (like/dislike) a un comentario o a una publicación. Es un toggle',
    description:
      'Enviar EXACTAMENTE uno de los dos: commentUuid o publicationUuid, junto con type ("like" | "dislike"). ' +
      'Si no había reacción, se crea. Si ya tenía el mismo tipo, se elimina. ' +
      'Si tenía el tipo contrario, se reemplaza. Nunca queda like y dislike a la vez.',
  })
  @ApiBody({ type: CreateReactionDto })
  @ApiOkResponse({
    description: 'Reacción procesada correctamente. El campo `action` indica qué ocurrió.',
    schema: {
      example: {
        action: 'created',
        reaction: {
          id: 1,
          type: 'like',
          author: { index: 5, uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          comment: { index: 10, uuid: 'a1b2c3d4-e5f6-4789-a012-3456789abcde' },
          publication: null,
          createdAt: '2026-08-08T10:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'No se envió ni commentUuid ni publicationUuid, o se enviaron ambos al mismo tiempo (solo se permite uno).',
    schema: {
      example: {
        statusCode: 400,
        message: 'Debes indicar commentUuid o publicationUuid',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No existe el comentario o la publicación indicada.',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontró el comentario a reaccionar',
        error: 'Not Found',
      },
    },
  })
  react(@Body() dto: CreateReactionDto, @Req() req: any) {
    return this.reactionService.react(dto, req.user);
  }

  @Get('comment/:uuid')
  @ApiOperation({
    summary: 'Ver el resumen de likes/dislikes de un comentario',
    description:
      'Retorna el conteo total de likes y dislikes de un comentario. ' +
      'Si se envía `userUuid`, además indica cuál es la reacción propia de ese usuario (si existe).',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID del comentario a consultar',
    example: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  })
  @ApiQuery({
    name: 'userUuid',
    required: false,
    description: 'UUID del usuario para incluir su reacción propia en la respuesta',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiOkResponse({
    description: 'Resumen de reacciones del comentario.',
    schema: {
      example: { likes: 12, dislikes: 3, userReaction: 'like' },
    },
  })
  getCommentSummary(@Param('uuid') uuid: string, @Query('userUuid') userUuid?: string) {
    return this.reactionService.getCommentSummary(uuid, userUuid);
  }

  @Get('publication/:uuid')
  @ApiOperation({
    summary: 'Ver el resumen de likes/dislikes de una publicación',
    description:
      'Retorna el conteo total de likes y dislikes de una publicación. ' +
      'Si se envía `userUuid`, además indica cuál es la reacción propia de ese usuario (si existe).',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID de la publicación a consultar',
    example: '9c858901-8a57-4791-81fe-4c455b099bc9',
  })
  @ApiQuery({
    name: 'userUuid',
    required: false,
    description: 'UUID del usuario para incluir su reacción propia en la respuesta',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiOkResponse({
    description: 'Resumen de reacciones de la publicación.',
    schema: {
      example: { likes: 34, dislikes: 5, userReaction: null },
    },
  })
  getPublicationSummary(@Param('uuid') uuid: string, @Query('userUuid') userUuid?: string) {
    return this.reactionService.getPublicationSummary(uuid, userUuid);
  }
}
