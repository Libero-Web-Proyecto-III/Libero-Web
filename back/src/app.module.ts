import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PublicationModule } from './modules/publication/publication.module';
import { EventModule } from './modules/event/event.module';

@Module({
  imports: [PublicationModule, EventModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
