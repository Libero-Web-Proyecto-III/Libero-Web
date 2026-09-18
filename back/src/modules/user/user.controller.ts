import { Controller, Get, Post, Patch, Delete, Body, Query, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto, UpdateUserTagDto, UpdateUserTagsDto } from './dto/update-user.dto';
import { GetAllQueryDto } from 'src/common/dto/get-all.dto';
import { PRIVATE } from 'src/common/decorator/private.decorator';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import { ROLES } from 'src/common/decorator/roles.decorator';
import { enumRol } from 'src/common/enums/rol.enum';

// # Este bloque tiene como objetivo exponer los endpoints para la gestión administrativa de usuarios (listar, cambiar rol, editar y eliminar)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // # Este bloque tiene como objetivo listar a todos los usuarios con paginación
  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  @ApiOperation({ summary: 'Lista a todos los usuarios por paginación' })
  @ApiOkResponse({ description: 'Listado de usuarios obtenida correctamente', type: [UserEntity] })
  @Get()
  getAll(@Query() query: GetAllQueryDto) {
    return this.userService.findAll(query);
  }

  // # Este bloque tiene como objetivo crear un nuevo usuario desde el panel
  @ApiOperation({ summary: 'Crea un nuevo usuario' })
  @ApiOkResponse({ description: 'Usuario creado con exito', type: UserEntity })
  @ApiBadRequestResponse({ description: 'No se pudo crear usuario, revisa el BODY de la petición', schema: { example: 'Ya existe un usuario con ese nombre' } })
  @Post()
  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  post(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // # Este bloque tiene como objetivo permitir al Administrador cambiar el rol de un usuario (ej. promover usuario a admin)
  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  @ApiOperation({ summary: 'Cambiar el rol de un usuario por UUID' })
  @Patch(':uuid/role')
  changeRole(
    @Param('uuid') uuid: string,
    @Body('role') role: enumRol,
  ) {
    return this.userService.updateRole(uuid, role);
  }

  // # Este bloque tiene como objetivo permitir al Administrador actualizar los datos de un usuario
  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  @ApiOperation({ summary: 'Actualizar datos de un usuario por UUID' })
  @Patch(':uuid')
  updateUser(
    @Param('uuid') uuid: string,
    @Body() body: { name?: string; email?: string; avatar?: string },
  ) {
    return this.userService.update(uuid, body);
  }

  // # Este bloque tiene como objetivo permitir al Administrador eliminar a un usuario del sistema
  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  @ApiOperation({ summary: 'Eliminar a un usuario por UUID' })
  @Delete(':uuid')
  deleteUser(@Param('uuid') uuid: string) {
    return this.userService.delete(uuid);
  }

  // # Este bloque tiene como objetivo buscar un usuario por su nombre
  @ApiOperation({ summary: 'Busca un usuario por su NOMBRE' })
  @ApiOkResponse({ description: 'Usuario hallado con exito', type: UserEntity })
  @Get(':name')
  getOne(@Param('name') name: string) {
    return this.userService.findOneBy.name(name);
  }

  // # Este bloque tiene como objetivo actualizar el rol de un usuario
  @Patch(':uuid/role')
  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  @ApiOperation({ summary: 'Actualiza el rol de un usuario' })
  updateRole(@Param('uuid') uuid: string, @Body() body: UpdateUserRoleDto) {
    return this.userService.updateRole(uuid, body.role);
  }

  // # Este bloque tiene como objetivo actualizar el tag asignado a un usuario
  @Patch(':uuid/tag')
  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  @ApiOperation({ summary: 'Actualiza el tag asignado a un usuario' })
  updateTag(@Param('uuid') uuid: string, @Body() body: UpdateUserTagDto) {
    return this.userService.updateTag(uuid, body.tagId ?? null);
  }

  // # Este bloque tiene como objetivo actualizar las etiquetas asignadas a un usuario
  @Patch(':uuid/tags')
  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  @ApiOperation({ summary: 'Actualiza las etiquetas asignadas a un usuario' })
  updateTags(@Param('uuid') uuid: string, @Body() body: UpdateUserTagsDto) {
    return this.userService.updateTags(uuid, body.tagIds || []);
  }

  // # Este bloque tiene como objetivo eliminar lógicamente a un usuario por UUID
  @Delete(':uuid')
  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  @ApiOperation({ summary: 'Elimina lógicamente un usuario por UUID' })
  remove(@Param('uuid') uuid: string) {
    return this.userService.delete(uuid);
  }
}
