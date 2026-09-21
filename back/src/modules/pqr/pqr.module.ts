import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PqrEntity } from './entities/pqr.entity';
import { PqrService } from './pqr.service';
import { PqrController } from './pqr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PqrEntity])],
  controllers: [PqrController],
  providers: [PqrService],
})
export class PqrModule {}