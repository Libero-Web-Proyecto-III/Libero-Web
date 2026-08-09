import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'UUID de la publicación que se desea comentar',
    example: '9c858901-8a57-4791-81fe-4c455b099bc9',
  })
  @IsUUID()
  publicationUuid: string;

  @ApiProperty({
    description: 'Contenido del comentario. Máximo 2000 caracteres',
    example: 'Muy buen post!',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
