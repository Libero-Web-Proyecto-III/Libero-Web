import { IsEnum, IsUUID, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReactionType } from '../enum/reactionType.enum';

// Se debe enviar EXACTAMENTE uno de los dos: commentUuid o publicationUuid.
// (la validación de "no ambos / no ninguno" también se refuerza en el service)
export class CreateReactionDto {
  @ApiPropertyOptional({ description: 'UUID del comentario a reaccionar (si no se envía publicationUuid)' })
  @ValidateIf((dto) => !dto.publicationUuid)
  @IsUUID()
  commentUuid?: string;

  @ApiPropertyOptional({ description: 'UUID de la publicación a reaccionar (si no se envía commentUuid)' })
  @ValidateIf((dto) => !dto.commentUuid)
  @IsUUID()
  publicationUuid?: string;

  @ApiProperty({ enum: ReactionType, example: ReactionType.LIKE })
  @IsEnum(ReactionType)
  type: ReactionType;
}
