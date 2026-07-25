import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from './interface/auth-user.interface';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);

    if (!user) {
      throw new UnauthorizedException(
        'Correo o contraseña incorrectos.',
      );
    }

    const token = this.generateToken({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return this.buildLoginResponse(token, user);
  }

  async register(dto: RegisterDto) {
    const passwordHash = await this.hashPassword(dto.password);

    // TODO: Integrar con UsersService.create()
    // Guardar username, email y passwordHash en la base de datos.

    return {
      success: true,
      message: 'Endpoint de registro preparado.',
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
      },
    };
  }

  async validateUser(dto: LoginDto): Promise<AuthUser | null> {
    // TODO: Reemplazar por UsersService.validateUser()

    return {
      id: 1,
      username: 'eduardo',
      email: dto.email,
      role: 'ADMIN',
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  generateToken(payload: {
    sub: number;
    username: string;
    role: string;
  }): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  buildLoginResponse(
    accessToken: string,
    user: AuthUser,
  ) {
    return {
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        accessToken,
        user,
      },
    };
  }

    async requestPasswordReset(email: string) {
    // TODO:
    // 1. Buscar el usuario por email.
    // 2. Generar un token seguro.
    // 3. Enviar el correo con Nodemailer.

    return {
      success: true,
      message: 'Solicitud de recuperación preparada.',
        data: {
        email,
      },
    };
  }

  async resetPassword(
    token: string,
    password: string,
  ) {
    const passwordHash = await this.hashPassword(password);

    // TODO:
    // 1. Validar el token.
    // 2. Buscar el usuario.
    // 3. Actualizar el passwordHash usando UsersService.

  return {
      success: true,
      message: 'Cambio de contraseña preparado.',
      data: {
        token,
        passwordHash,
      },
    };
  }
}