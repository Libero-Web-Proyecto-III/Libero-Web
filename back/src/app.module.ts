import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { TagModule } from './modules/tag/tag.module';
import { RolModule } from './modules/rol/rol.module';
import { UserModule } from './modules/user/user.module';


@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),

    DatabaseModule,

    TagModule, RolModule,
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
