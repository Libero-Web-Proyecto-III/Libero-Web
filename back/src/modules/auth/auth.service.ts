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
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);

    if (!user) {
      throw new UnauthorizedException(
        'Correo, usuario o contraseña incorrectos.',
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
    const newUser = await this.userService.create({
      name: dto.username,
      email: dto.email,
      password: dto.password,
      avatar: '',
    });

    return {
      success: true,
      message: 'Usuario registrado correctamente.',
      data: newUser,
    };
  }

  async validateUser(dto: LoginDto): Promise<AuthUser | null> {
    let user = await this.userService.findOrNull.email(
      dto.identifier,
    );

    if (!user) {
      user = await this.userService.findOrNull.name(
        dto.identifier,
      );
    }

    if (!user) {
      return null;
    }

    const passwordCorrect = await this.comparePassword(
      dto.password,
      user.password,
    );

    if (!passwordCorrect) {
      return null;
    }

    return {
      id: user.index,
      username: user.name,
      email: user.email,
      role: user.rol.name,
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