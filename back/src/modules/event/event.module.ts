import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './entities/event.entity';
import { EventSubscriptionEntity } from './entities/event-subscription.entity';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { MailModule } from '../mail/mail.module';
import { EventReminderSchedulerService } from './event-reminder-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, EventSubscriptionEntity]),
    MailModule,
  ],
  controllers: [EventController],
  providers: [EventService, EventReminderSchedulerService],
  exports: [EventService, EventReminderSchedulerService],
})
export class EventModule {}