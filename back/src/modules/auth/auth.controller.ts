import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';
import { PRIVATE } from '../../common/decorator/private.decorator';
import { ROLES } from '../../common/decorator/roles.decorator';
import { enumRol } from '../../common/enums/rol.enum';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Permite iniciar sesión utilizando el correo electrónico o nombre de usuario junto con la contraseña.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso.',
    example: {
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
        user: {
          id: 1,
          username: 'usuario',
          email: 'usuario@example.com',
          role: 'user',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales incorrectas.',
    example: {
      message: 'Correo o contraseña incorrectos.',
      error: 'Unauthorized',
      statusCode: 401,
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Registrar usuario',
    description: 'Registra un nuevo usuario en la plataforma.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado correctamente.',
    example: {
      success: true,
      message: 'Usuario registrado correctamente.',
      data: {
        index: 1,
        uuid: '00000000-0000-0000-0000-000000000000',
        name: 'usuario',
        email: 'usuario@example.com',
        avatar: '',
        rol: {
          id: 1,
          name: 'user',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de registro inválidos.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('request-password-reset')
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña',
    description:
      'Solicita el proceso de recuperación de contraseña mediante el correo electrónico del usuario.',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud de recuperación preparada.',
    example: {
      success: true,
      message: 'Solicitud de recuperación preparada.',
      data: {
        email: 'usuario@example.com',
      },
    },
  })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description:
      'Permite cambiar la contraseña utilizando un token de recuperación.',
  })
  @ApiResponse({
    status: 201,
    description: 'Cambio de contraseña preparado.',
    example: {
      success: true,
      message: 'Cambio de contraseña preparado.',
      data: {
        token: 'token-de-recuperacion',
        passwordHash: '$2b$10$...',
      },
    },
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.token,
      dto.password,
    );
  }

  @PRIVATE()
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil',
    description:
      'Obtiene la información del usuario autenticado mediante el token JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del usuario autenticado.',
    example: {
      id: 1,
      username: 'usuario',
      email: 'usuario@example.com',
      role: 'user',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token no válido o no proporcionado.',
  })
  getProfile(@Request() req: any) {
    return req.user;
  }

  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Acceso administrativo',
    description:
      'Permite acceder al endpoint únicamente a usuarios con rol de administrador.',
  })
  @ApiResponse({
    status: 200,
    description: 'Acceso permitido para administradores.',
    example: {
      message: 'Solo administradores pueden acceder.',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'El usuario no tiene permisos de administrador.',
  })
  getAdmin() {
    return {
      message: 'Solo administradores pueden acceder.',
    };
  }
}