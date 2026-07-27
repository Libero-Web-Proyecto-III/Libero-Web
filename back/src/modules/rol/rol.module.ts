import { Module } from '@nestjs/common';
import { RolEntity } from './entities/rol.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolSeederService } from '../../seeders/rol-seeder';
import { RolService } from './rol.service';

@Module({
  imports: [TypeOrmModule.forFeature([RolEntity])],
  providers: [RolService, RolSeederService],
  exports: [RolService],

})
export class RolModule { }