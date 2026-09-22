import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetAllEventQueryDto } from './dto/get-event-query.dto';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { enumRol } from 'src/common/enums/rol.enum';
import { MailService } from '../mail/mail.service';
import { NotifyEventDto } from './dto/notify-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly EventRepository: Repository<EventEntity>,
    private readonly mailService: MailService,
  ) { }

  async notifyEvent(dto: NotifyEventDto, user: any): Promise<{ success: boolean; message: string }> {
    const targetEmail = user?.email;
    if (!targetEmail) {
      throw new BadRequestException('No se pudo identificar el correo electrónico del usuario para enviar la notificación.');
    }

    return this.mailService.sendEventNotification(targetEmail, user.username, {
      title: dto.title,
      subtitle: dto.subtitle,
      date: dto.date,
      time: dto.time,
      location: dto.location,
      description: dto.description,
      imageUrl: dto.imageUrl,
    });
  }

  getLastEmailHtml(): string {
    return this.mailService.getLastEmailHtml();
  }

  async create(createEventDto: CreateEventDto, organizer?: any): Promise<EventEntity> {
    const now = new Date();
    const startDate = createEventDto.startDate ? new Date(createEventDto.startDate) : now;
    const endDate = createEventDto.endDate ? new Date(createEventDto.endDate) : new Date(now.getTime() + 4 * 3600 * 1000);

    const organizerId = organizer?.id || organizer?.index;

    const newEvent = this.EventRepository.create({
      ...createEventDto,
      status: createEventDto.status || 'active',
      startDate,
      endDate,
      organizer: organizerId ? ({ index: organizerId } as UserEntity) : undefined,
    });
    return this.EventRepository.save(newEvent);
  }

  async findAll(query?: GetAllEventQueryDto): Promise<EventEntity[]> {
    const where: any = {};
    if (query?.status) where.status = query.status;

    return await this.EventRepository.find({
      where,
      relations: { organizer: { rol: true } },
      order: { createdAt: 'DESC' },
    });
  }

  findOneBy = {
    uuid: async (uuid: string): Promise<EventEntity> => {
      const event = await this.EventRepository.findOne({
        where: { uuid },
        relations: { organizer: { rol: true } },
      });

      if (!event) throw new NotFoundException('No se encontró este evento por UUID');
      return event;
    },
  };

  async update(uuid: string, updateEventDto: UpdateEventDto): Promise<EventEntity> {
    const event = await this.findOneBy.uuid(uuid);
    const updated = this.EventRepository.merge(event, updateEventDto);
    if (updateEventDto.startDate) updated.startDate = new Date(updateEventDto.startDate);
    if (updateEventDto.endDate) updated.endDate = new Date(updateEventDto.endDate);
    return this.EventRepository.save(updated);
  }

  async remove(uuid: string, requester?: { role: string }): Promise<void> {
    const event = await this.findOneBy.uuid(uuid);
    await this.EventRepository.remove(event);
  }
}