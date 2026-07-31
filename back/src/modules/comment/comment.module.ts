import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PublicationEntity } from 'src/modules/publication/entities/publication.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity, PublicationEntity])],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
