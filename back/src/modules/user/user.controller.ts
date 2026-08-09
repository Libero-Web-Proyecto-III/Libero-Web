import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetAllQueryDto } from 'src/common/dto/get-all.dto';
import { PRIVATE } from 'src/common/decorator/private.decorator';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @PRIVATE()
  @ApiOperation({ summary: 'Lista a todos los usuarios por paginación' })
  @ApiOkResponse({ description: 'Listado de usuarios obtenida correctamente', type: [UserEntity] })
  @Get()
  getAll(@Query() query: GetAllQueryDto) {
    return this.userService.findAll(query)
  }

  @ApiOperation({ summary: 'Crea un nuevo usuario' })
  @ApiOkResponse({ description: 'Usuario creado con exito', type: UserEntity })
  @ApiBadRequestResponse({ description: 'No se pudo crear usuario, revisa el BODY de la petición', schema: { example: 'Ya existe un usuario con ese nombre' } })
  @Post()
  post(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @ApiOperation({ summary: 'Busca un usuario por su NOMBRE' })
  @ApiOkResponse({ description: 'Usuario hallado con exito', type: UserEntity })
  @Get(':name')
  getOne(@Param('name') name: string) {
    return this.userService.findOneBy.name(name)
  }
}
