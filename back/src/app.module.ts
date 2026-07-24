import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TagModule } from './modules/tag/tag.module';
import { RolModule } from './modules/rol/rol.module';

@Module({
  imports: [TagModule, RolModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
