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
    summary: 'Reaccionar (like/dislike) a un comentario. Es un toggle',
    description:
      'Si no había reacción, se crea. Si ya tenía el mismo tipo, se elimina. ' +
      'Si tenía el tipo contrario, se reemplaza. Nunca queda like y dislike a la vez.',
  })
  react(@Body() dto: CreateReactionDto, @Req() req: any) {
    return this.reactionService.react(dto, req.user);
  }

  @Get('comment/:uuid')
  @ApiOperation({ summary: 'Ver el resumen de likes/dislikes de un comentario' })
  @ApiQuery({ name: 'userUuid', required: false, description: 'Para incluir la reacción propia' })
  getSummary(@Param('uuid') uuid: string, @Query('userUuid') userUuid?: string) {
    return this.reactionService.getSummary(uuid, userUuid);
  }
}
