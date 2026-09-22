import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';

import { PRIVATE } from '../../common/decorator/private.decorator';
import { Public } from '../../common/decorator/public.decorator';
import { ROLES } from '../../common/decorator/roles.decorator';

import { enumRol } from '../../common/enums/rol.enum';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
  @Public()
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @Public()
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @PRIVATE()
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @PRIVATE()
  @Patch('profile')
  updateProfile(
    @Request() req: any,
    @Body() dto: { name?: string; avatar?: string },
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @PRIVATE()
  @Post('verify-password')
  verifyPassword(
    @Request() req: any,
    @Body('password') password: string,
  ) {
    return this.authService.verifyPassword(req.user.id, password);
  }

  @PRIVATE()
  @Patch('change-password')
  changePassword(
    @Request() req: any,
    @Body() dto: { newPassword: string; currentPassword: string },
  ) {
    return this.authService.changePassword(req.user.id, dto);
  }

  @PRIVATE()
  @Delete('account')
  deleteAccount(@Request() req: any) {
    return this.authService.deleteAccount(req.user.id);
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