import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FacebookService, FacebookPost } from './facebook.service';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('Facebook')
@Controller('facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Public()
  @Get('posts')
  @ApiOperation({
    summary: 'Obtener últimas publicaciones de Facebook',
    description: 'Devuelve las 3 publicaciones más recientes de la página oficial de Facebook de Libero Cobre.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 3, description: 'Número máximo de publicaciones a retornar' })
  @ApiResponse({ status: 200, description: 'Listado de publicaciones de Facebook' })
  async getPosts(@Query('limit') limit?: number): Promise<FacebookPost[]> {
    const count = limit ? Number(limit) : 3;
    return this.facebookService.getLatestPosts(count);
  }
}
