import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { EventEntity } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetAllEventQueryDto } from './dto/get-event-query.dto';
import { EventStatus } from './enum/eventStatus.enum';
import { UserEntity } from 'src/modules/user/entities/user.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly EventRepository: Repository<EventEntity>,
  ) { }

  async create(createEventDto: CreateEventDto, organizer: UserEntity): Promise<EventEntity> {
    const newEvent = this.EventRepository.create({
      ...createEventDto,
      startDate: new Date(createEventDto.startDate),
      endDate: new Date(createEventDto.endDate),
      organizer,
    });
    return this.EventRepository.save(newEvent);
  }

  async findAll(query: GetAllEventQueryDto): Promise<EventEntity[]> {
    const now = new Date();
    const where: any = {};

    if (query.tagUuid) where.tag = { uuid: query.tagUuid };
    if (query.status === EventStatus.UPCOMING) where.startDate = MoreThan(now);
    if (query.status === EventStatus.FINISHED) where.endDate = LessThan(now);

    const events = await this.EventRepository.find({
      where,
      relations: { organizer: true, tag: true },
      order: { startDate: 'ASC' },
    });

    if (query.status === EventStatus.ONGOING) {
      return events.filter((e) => e.startDate <= now && e.endDate >= now);
    }
    return events;
  }

  findOneBy = {
    uuid: async (uuid: string): Promise<EventEntity> => {
      const event = await this.EventRepository.findOne({
        where: { uuid },
        relations: { organizer: true, tag: true },
      });

      if (!event) throw new NotFoundException('No se encontró este evento por UUID');
      return event;
    },
  };

  async update(uuid: string, updateEventDto: UpdateEventDto): Promise<EventEntity> {
    const event = await this.findOneBy.uuid(uuid);
    return this.EventRepository.save({ index: event.index, ...updateEventDto });
  }

  async remove(uuid: string): Promise<void> {
    const event = await this.findOneBy.uuid(uuid);
    await this.EventRepository.remove(event);
  }
}