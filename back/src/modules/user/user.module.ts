import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { RolModule } from '../rol/rol.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),

    RolModule
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
