import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GetAllQueryDto } from 'src/common/dto/get-all.dto';

export class GetCommentQueryDto extends GetAllQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar comentarios por publicación (uuid). Si no se envía, se listan todos los comentarios',
    example: '9c858901-8a57-4791-81fe-4c455b099bc9',
  })
  @IsOptional()
  @IsUUID()
  publicationUuid?: string;
}
