import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationEntity } from './entities/publication.entity';
import { PublicationService } from './publication.service';
import { PublicationController } from './publication.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PublicationEntity])],
  controllers: [PublicationController],
  providers: [PublicationService],
  exports: [PublicationService],
})
export class PublicationModule {}