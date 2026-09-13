import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolEntity } from 'src/modules/rol/entities/rol.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { enumRol } from 'src/common/enums/rol.enum';
import bcrypt from 'bcrypt';

@Injectable()
export class RolSeederService implements OnModuleInit {
  private readonly logger = new Logger(RolSeederService.name);

  constructor(
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async onModuleInit() {
    await this.SeedRol();
    await this.SeedAdminUser();
  }

  async SeedRol() {
    const rolToCreate = Object.values(enumRol);

    for (const role of rolToCreate) {
      const exist = await this.rolRepository.findOneBy({ name: role });
      if (!exist) {
        const newRole = this.rolRepository.create({ name: role });
        await this.rolRepository.save(newRole);
      }
    }
  }

  async SeedAdminUser() {
    try {
      const adminRole = await this.rolRepository.findOneBy({ name: enumRol.ADMIN });
      if (!adminRole) return;

      const existingAdmin = await this.userRepository.findOne({
        where: [{ email: 'admin@libero.com' }, { name: 'admin' }],
        relations: { rol: true },
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        const adminUser = this.userRepository.create({
          name: 'admin',
          email: 'admin@libero.com',
          password: hashedPassword,
          avatar: '',
          rol: adminRole,
        });
        await this.userRepository.save(adminUser);
        this.logger.log('Admin user seeded: admin@libero.com / Admin123!');
      } else if (existingAdmin.rol?.name !== enumRol.ADMIN) {
        existingAdmin.rol = adminRole;
        await this.userRepository.save(existingAdmin);
      }
    } catch (err) {
      this.logger.error('Error seeding admin user:', err);
    }
  }
}