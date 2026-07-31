import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GetAllQueryDto } from 'src/common/dto/get-all.dto';

export class GetCommentQueryDto extends GetAllQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar comentarios por publicación (uuid)' })
  @IsOptional()
  @IsUUID()
  publicationUuid?: string;
}
