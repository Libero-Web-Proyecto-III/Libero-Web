import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';

import { PRIVATE } from '../../common/decorator/private.decorator';
import { ROLES } from '../../common/decorator/roles.decorator';

import { enumRol } from '../../common/enums/rol.enum';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('request-password-reset')
  requestPasswordReset(
    @Body('email') email: string,
  ) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(
      token,
      password,
    );
  }

  @PRIVATE()
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @PRIVATE()
  @ROLES([enumRol.ADMIN])
  @Get('admin')
  getAdmin() {
    return {
      message: 'Solo administradores pueden acceder.',
    };
  }
}