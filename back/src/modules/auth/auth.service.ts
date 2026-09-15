import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from './interface/auth-user.interface';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly passwordResetTokenRepository: Repository<PasswordResetTokenEntity>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userService.findByIdentifier(dto.identifier);

    if (!user) {
      throw new NotFoundException(
        'Cuenta no encontrada o no registrada',
      );
    }

    const passwordCorrect = await this.comparePassword(
      dto.password,
      user.password,
    );

    if (!passwordCorrect) {
      throw new UnauthorizedException(
        'Contraseña incorrecta',
      );
    }

    const authUser: AuthUser = {
      id: user.index,
      username: user.name,
      email: user.email,
      role: user.rol?.name || 'user',
    };

    const token = this.generateToken({
      sub: authUser.id,
      username: authUser.username,
      email: authUser.email,
      role: authUser.role,
    });

    return this.buildLoginResponse(token, authUser);
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

    const user = await this.userService.findByIdentifier(
      dto.identifier,
    );

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
      role: user.rol?.name || 'user',
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
    email?: string;
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
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userService.findOrNull.email(normalizedEmail);

    if (user) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.passwordResetTokenRepository.update(
        { user: { index: user.index }, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      await this.passwordResetTokenRepository.save(
        this.passwordResetTokenRepository.create({ user, tokenHash, expiresAt }),
      );

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
      await this.mailService.sendPasswordResetEmail(
        normalizedEmail,
        user.name,
        `${frontendUrl}/auth/reset-password?token=${token}`,
      );
    }

    return {
      success: true,
      message: 'Si el correo está registrado, recibirás un enlace de recuperación.',
    };
  }

  async resetPassword(
    token: string,
    password: string,
  ) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('El enlace de recuperación no es válido o ha expirado.');
    }

    resetToken.user.password = await this.hashPassword(password);
    resetToken.usedAt = new Date();
    await this.passwordResetTokenRepository.manager.transaction(async (manager) => {
      await manager.save(resetToken.user);
      await manager.save(resetToken);
      await manager.update(
        PasswordResetTokenEntity,
        { user: { index: resetToken.user.index }, usedAt: IsNull() },
        { usedAt: new Date() },
      );
    });

    return {
      success: true,
      message: 'Contraseña actualizada correctamente.',
    };
  }
}