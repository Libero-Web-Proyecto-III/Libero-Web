import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
  @ApiOperation({
    summary: 'Enviar una PQR',
    description: 'Endpoint público: cualquier persona puede enviar una petición, queja, reclamo o sugerencia, sin necesidad de cuenta.',
  })
  @ApiResponse({ status: 201, description: 'PQR registrada correctamente', type: PqrEntity })
  create(@Body() dto: CreatePqrDto) {
    return this.pqrService.create(dto);
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
  updateStatus(@Param('uuid') uuid: string, @Body() dto: UpdatePqrStatusDto) {
    return this.pqrService.updateStatus(uuid, dto);
  }
}