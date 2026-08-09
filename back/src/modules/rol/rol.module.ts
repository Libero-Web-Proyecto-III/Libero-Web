import { Module } from '@nestjs/common';
import { RolEntity } from './entities/rol.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolSeederService } from '../../seeders/rol-seeder';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RolEntity])],
  controllers: [RolController],
  providers: [RolService, RolSeederService],
  exports: [RolService],

})
export class RolModule { } 