import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
  react(@Body() dto: CreateReactionDto, @Req() req: any) {
    return this.reactionService.react(dto, req.user);
  }

  @Get('comment/:uuid')
  @ApiOperation({ summary: 'Ver el resumen de likes/dislikes de un comentario' })
  @ApiQuery({ name: 'userUuid', required: false, description: 'Para incluir la reacción propia' })
  getCommentSummary(@Param('uuid') uuid: string, @Query('userUuid') userUuid?: string) {
    return this.reactionService.getCommentSummary(uuid, userUuid);
  }

  @Get('publication/:uuid')
  @ApiOperation({ summary: 'Ver el resumen de likes/dislikes de una publicación' })
  @ApiQuery({ name: 'userUuid', required: false, description: 'Para incluir la reacción propia' })
  getPublicationSummary(@Param('uuid') uuid: string, @Query('userUuid') userUuid?: string) {
    return this.reactionService.getPublicationSummary(uuid, userUuid);
  }
}
