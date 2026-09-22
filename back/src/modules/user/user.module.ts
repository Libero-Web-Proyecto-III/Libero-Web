import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { RolEntity } from '../rol/entities/rol.entity';
import { RolModule } from '../rol/rol.module';
import { TagModule } from '../tag/tag.module';
import { UserSeederService } from '../../seeders/user-seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RolEntity]),

    RolModule, TagModule
  ],
  controllers: [UserController],
  providers: [UserService, UserSeederService],
  exports: [UserService]
})
export class UserModule {}
