import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PqrEntity } from './entities/pqr.entity';
import { PqrService } from './pqr.service';
import { PqrController } from './pqr.controller';
import { NotificationModule } from '../notification/notification.module';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PqrEntity, UserEntity]), NotificationModule],
  controllers: [PqrController],
  providers: [PqrService],
  exports: [PqrService],
})
export class PqrModule {}