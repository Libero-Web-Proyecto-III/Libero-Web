import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCommentDto } from './create-comment.dto';

// No se puede cambiar la publicación de un comentario, solo su contenido.
export class UpdateCommentDto extends PartialType(
  OmitType(CreateCommentDto, ['publicationUuid'] as const),
) {}
