import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '../enum/reactionType.enum';

export class CreateReactionDto {
  @ApiProperty({ description: 'UUID del comentario a reaccionar' })
  @IsUUID()
  commentUuid: string;

  @ApiProperty({ enum: ReactionType, example: ReactionType.LIKE })
  @IsEnum(ReactionType)
  type: ReactionType;
}
