import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../modules/user/entities/user.entity';
import { RolEntity } from '../modules/rol/entities/rol.entity';
import { enumRol } from '../common/enums/rol.enum';

// # Este bloque tiene como objetivo definir el servicio Seeder para inicializar usuarios requeridos en el sistema
@Injectable()
export class UserSeederService implements OnModuleInit {
  private readonly logger = new Logger(UserSeederService.name);
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
  ) {}

  // # Este bloque tiene como objetivo ejecutar la siembra automática al iniciar el módulo NestJS
  async onModuleInit() {
    await this.seedUsers();
  }

  // # Este bloque tiene como objetivo crear los usuarios de inicio de sesión de ejemplo si no existen (adminejemplo@gmail.com y usuarioejemplo@gmail.com)
  async seedUsers() {
    const adminRole = await this.rolRepository.findOneBy({ name: enumRol.ADMIN });
    const userRole = await this.rolRepository.findOneBy({ name: enumRol.USER });

    if (!adminRole || !userRole) {
      this.logger.warn('Los roles aún no han sido inicializados. Se reintentará la siembra de usuarios.');
      return;
    }

    const demoUsers = [
      {
        email: 'adminejemplo@gmail.com',
        name: 'Admin Ejemplo',
        password: 'AdminPassword',
        role: adminRole,
      },
      {
        email: 'usuarioejemplo@gmail.com',
        name: 'Usuario Ejemplo',
        password: 'UsuarioPassword',
        role: userRole,
      },
    ];

    for (const user of demoUsers) {
      const existingUser = await this.userRepository.findOneBy({ email: user.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(user.password, this.saltRounds);
        const newUser = this.userRepository.create({
          email: user.email,
          name: user.name,
          password: hashedPassword,
          rol: user.role,
          avatar: '',
        });
        await this.userRepository.save(newUser);
        this.logger.log(`Usuario demo sembrado exitosamente: ${user.email}`);
      }
    }
  }
}
