import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan, LessThan, Repository } from 'typeorm';
import { EventEntity } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventDto } from './dto/filter-event.dto';
import { EventStatus } from './enum/eventStatus.enum';
import { UserService } from '../user/user.service';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async create(dto: CreateEventDto, organizer: User): Promise<Event> {
    const event = this.eventRepo.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      organizer,
      tag: dto.tagId ? ({ id: dto.tagId } as any) : null,
    });
    return this.eventRepo.save(event);
  }

  async findAll(filter: FilterEventDto): Promise<Event[]> {
    const now = new Date();
    const where: any = {};

    if (filter.tagId) where.tag = { id: filter.tagId };

    if (filter.status === EventStatus.UPCOMING) {
      where.startDate = MoreThan(now);
    } else if (filter.status === EventStatus.FINISHED) {
      where.endDate = LessThan(now);
    }

    const events = await this.eventRepo.find({
      where,
      relations: ['organizer', 'tag'],
      order: { startDate: 'ASC' },
    });

    if (filter.status === EventStatus.ONGOING) {
      return events.filter((e) => e.startDate <= now && e.endDate >= now);
    }

    return events;
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['organizer', 'tag'],
    });
    if (!event) {
      throw new NotFoundException(`Evento con id ${id} no encontrado`);
    }
    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    Object.assign(event, dto);
    return this.eventRepo.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepo.remove(event);
  }
}