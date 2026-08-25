import { IsEnum, IsUUID, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReactionType } from '../enum/reactionType.enum';

// Se debe enviar EXACTAMENTE uno de los dos: commentUuid o publicationUuid.
// (la validación de "no ambos / no ninguno" también se refuerza en el service)
export class CreateReactionDto {
  @ApiPropertyOptional({
    description:
      'UUID del comentario a reaccionar. Enviar SOLO si no se envía `publicationUuid` ' +
      '(se debe indicar exactamente uno de los dos campos)',
    example: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  })
  @ValidateIf((dto) => !dto.publicationUuid)
  @IsUUID()
  commentUuid?: string;

  @ApiPropertyOptional({
    description:
      'UUID de la publicación a reaccionar. Enviar SOLO si no se envía `commentUuid` ' +
      '(se debe indicar exactamente uno de los dos campos)',
    example: '9c858901-8a57-4791-81fe-4c455b099bc9',
  })
  @ValidateIf((dto) => !dto.commentUuid)
  @IsUUID()
  publicationUuid?: string;

  @ApiProperty({
    description: 'Tipo de reacción a aplicar',
    enum: ReactionType,
    example: ReactionType.LIKE,
  })
  @IsEnum(ReactionType)
  type: ReactionType;
}
