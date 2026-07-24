import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolEntity } from 'src/modules/rol/entities/rol.entity';
import { enumRol } from 'src/common/enums/rol.enum';


@Injectable()
export class RolSeederService implements OnModuleInit {
  private readonly logger = new Logger(RolSeederService.name);

  constructor(
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
  ) {}


  async onModuleInit() {
    await this.SeedRol()
  }


  async SeedRol() {
    const rolToCreate = Object.values(enumRol);

    for (const role of rolToCreate) {
        const exist = await this.rolRepository.findOneBy({ name: role })

      if (!exist) {
          const newRole = this.rolRepository.create({ name: role })
          await this.rolRepository.save(newRole)
      }
    }

  }
}