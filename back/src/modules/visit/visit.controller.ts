import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VisitService, VisitStatsResponse } from './visit.service';
import { RecordVisitDto } from './dto/record-visit.dto';

@ApiTags('Visits')
@Controller('visits')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar visita a una página',
    description: 'Registra un acceso anónimo a una ruta pública de la plataforma Líbero Web.',
  })
  @ApiBody({ type: RecordVisitDto })
  @ApiOkResponse({ description: 'Visita registrada con éxito' })
  async recordVisit(
    @Body() dto: RecordVisitDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<{ success: boolean }> {
    return this.visitService.recordVisit(dto, userAgent);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obtener analíticas y estadísticas de visitas',
    description: 'Retorna el total de visitas, visitantes únicos, páginas más concurridas y tendencia de los últimos 7 días.',
  })
  @ApiOkResponse({ description: 'Estadísticas de tráfico web' })
  async getStats(): Promise<VisitStatsResponse> {
    return this.visitService.getStats();
  }
}
