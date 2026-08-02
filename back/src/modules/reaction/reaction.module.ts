import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionEntity } from './entities/reaction.entity';
import { ReactionService } from './reaction.service';
import { ReactionController } from './reaction.controller';
import { CommentEntity } from 'src/modules/comment/entities/comment.entity';
import { PublicationEntity } from 'src/modules/publication/entities/publication.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReactionEntity, CommentEntity, PublicationEntity])],
  controllers: [ReactionController],
  providers: [ReactionService],
  exports: [ReactionService],
})
export class ReactionModule {}
