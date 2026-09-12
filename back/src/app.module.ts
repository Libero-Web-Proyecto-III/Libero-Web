import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { TagModule } from './modules/tag/tag.module';
import { RolModule } from './modules/rol/rol.module';
import { UserModule } from './modules/user/user.module';
import { PublicationModule } from './modules/publication/publication.module';
import { EventModule } from './modules/event/event.module';

import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guard/jwt-auth.guard';
import { RolesGuard } from './common/guard/roles.guard';
import { ReactionModule } from './modules/reaction/reaction.module';
import { CommentModule } from './modules/comment/comment.module';


@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),

    DatabaseModule,

    TagModule, RolModule,
    UserModule, PublicationModule, ReactionModule,
    EventModule, AuthModule, CommentModule
],
  controllers: [AppController],
  providers: [
    AppService,
    
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}