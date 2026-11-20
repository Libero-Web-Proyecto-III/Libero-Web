import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PqrService } from './pqr.service';
import { CreatePqrDto } from './dto/create-pqr.dto';
import { UpdatePqrStatusDto } from './dto/update-pqr-status.dto';
import { GetPqrQueryDto } from './dto/get-pqr-query.dto';
import { PqrEntity } from './entities/pqr.entity';

import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';
import { PRIVATE } from '../../common/decorator/private.decorator';
import { ROLES } from '../../common/decorator/roles.decorator';
import { enumRol } from '../../common/enums/rol.enum';

@ApiTags('PQRs')
@ApiBearerAuth()
@Controller('pqrs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PqrController {
  constructor(private readonly pqrService: PqrService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enviar una PQR (Público)',
    description: 'Endpoint público para enviar una petición, queja, reclamo o sugerencia.',
  })
  @ApiResponse({ status: 201, description: 'PQR registrada correctamente con su código de radicado', type: PqrEntity })
  create(@Body() dto: CreatePqrDto, @Req() req: any) {
    return this.pqrService.create(dto, req.user);
  }

  @Get('consultar/:radicado')
  @ApiOperation({
    summary: 'Consultar estado público de radicado',
    description: 'Permite a cualquier ciudadano consultar el estado y respuesta de su PQR mediante el código de radicado único.',
  })
  @ApiParam({ name: 'radicado', description: 'Código de radicado (ej. MC-2026-0001)' })
  @ApiResponse({ status: 200, description: 'Estado actual de la PQR' })
  consultar(@Param('radicado') radicado: string) {
    return this.pqrService.consultarPorRadicado(radicado);
  }

  @PRIVATE()
  @ROLES([enumRol.MOD, enumRol.ADMIN])
  @Get()
  @ApiOperation({
    summary: 'Listar PQRs (panel de gestión)',
    description: 'Solo moderadores o administradores. Permite filtrar por tipo y estado.',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de PQRs' })
  findAll(@Query() query: GetPqrQueryDto) {
    return this.pqrService.findAll(query);
  }

  @PRIVATE()
  @ROLES([enumRol.MOD, enumRol.ADMIN])
  @Get(':uuid')
  @ApiOperation({ summary: 'Obtener una PQR por UUID', description: 'Solo moderadores o administradores.' })
  @ApiParam({ name: 'uuid', description: 'UUID de la PQR' })
  @ApiResponse({ status: 200, description: 'PQR encontrada', type: PqrEntity })
  findOne(@Param('uuid') uuid: string) {
    return this.pqrService.findOneBy.uuid(uuid);
  }

  @PRIVATE()
  @ROLES([enumRol.MOD, enumRol.ADMIN])
  @Patch(':uuid/status')
  @ApiOperation({
    summary: 'Actualizar estado (y opcionalmente responder) una PQR',
    description: 'Solo moderadores o administradores.',
  })
  @ApiParam({ name: 'uuid', description: 'UUID de la PQR' })
  @ApiResponse({ status: 200, description: 'PQR actualizada', type: PqrEntity })
  updateStatus(@Param('uuid') uuid: string, @Body() dto: UpdatePqrStatusDto, @Req() req: any) {
    return this.pqrService.updateStatus(uuid, dto, req.user);
  }
}