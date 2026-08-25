import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RolService } from './rol.service';
import { RolEntity } from './entities/rol.entity';

@ApiTags('Rol')
@Controller('rol')
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Get(':name')
  @ApiOperation({
    summary: 'Obtener un rol por nombre',
    description: 'Devuelve el rol registrado usando su nombre exacto.',
  })
  @ApiParam({
    name: 'name',
    example: 'admin',
    description: 'Nombre del rol a buscar',
  })
  @ApiOkResponse({
    description: 'Rol encontrado correctamente',
    type: RolEntity,
  })
  @ApiNotFoundResponse({
    description: 'No existe un rol con ese nombre',
  })
  findOne(@Param('name') name: string) {
    return this.rolService.findOne(name);
  }
}