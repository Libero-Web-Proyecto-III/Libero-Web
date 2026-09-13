import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
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

const INITIAL_SEED_EVENTS: Partial<EventEntity>[] = [
  {
    title: 'SINFONÍA NOCTURNA: GALA Y MÚSICA EN VIVO',
    subtitle: 'Una velada inmersiva con la Orquesta Filarmónica Contemporánea',
    dateDay: '28',
    dateMonth: 'AGO',
    time: '20:30 - 23:30 HRS',
    location: 'Gran Teatro Metropolitano',
    city: 'Sala Principal',
    description: 'Disfruta de una experiencia acústica y visual sin precedentes. Un concierto exclusivo donde la luz, el sonido y el diseño minimalista se fusionan en una atmósfera totalmente inmersiva.',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80',
    status: 'active',
  },
  {
    title: 'SUMMIT INTERNACIONAL DE ARQUITECTURA & DISEÑO',
    subtitle: 'Conferencias magistrales sobre brutalismo, vanguardia y espacio urbano',
    dateDay: '05',
    dateMonth: 'SEP',
    time: '09:00 - 18:00 HRS',
    location: 'Centro de Convenciones Vanguard',
    city: 'Auditorio Alfa',
    description: 'Líderes mundiales del diseño se reúnen para debatir la evolución del espacio urbano, estructuras sostenibles y la estética del contraste en la era moderna.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
    status: 'active',
  },
  {
    title: 'RETROSPECTIVA DE FOTOGRAFÍA EN BLANCO Y NEGRO',
    subtitle: 'Exposición de sombras, contrastes y la belleza del claroscuro',
    dateDay: '12',
    dateMonth: 'SEP',
    time: '11:00 - 20:00 HRS',
    location: 'Galería de Arte Monocromo',
    city: 'Salón Blanco',
    description: 'Más de 150 piezas icónicas capturadas por fotógrafos de renombre mundial. Una exploración profunda de la textura, el ángulo y el dramatismo de la luz sin distracción de color.',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1400&q=80',
    status: 'active',
  },
  {
    title: 'NOCHE DE JAZZ & BLUES EN LA PENUMBRA',
    subtitle: 'Sesión íntima en vivo con cuarteto internacional de saxo y piano',
    dateDay: '19',
    dateMonth: 'SEP',
    time: '21:00 - 02:00 HRS',
    location: 'Club Nocturno Lúmen',
    city: 'Zona Principal',
    description: 'Siente el ritmo envolvente del jazz clásico en un ambiente tenue e íntimo. Iluminación suave y sonido puro para los amantes de la buena música.',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80',
    status: 'active',
  },
  {
    title: 'MUESTRA DE CINE INDEPENDIENTE EN 35MM',
    subtitle: 'Ciclo de largometrajes clásicos y obras maestras del cine de autor',
    dateDay: '25',
    dateMonth: 'SEP',
    time: '18:30 - 22:00 HRS',
    location: 'Cineforo Noir',
    city: 'Proyección 1',
    description: 'Una selección curada de filmes en celuloide original de 35mm. Incluye debate posterior con directores y críticos invitados sobre el arte cinematográfico.',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80',
    status: 'active',
  },
  {
    title: 'ENCUENTRO DE POESÍA CONTEMPORÁNEA & VINO',
    subtitle: 'Recital acústico y cata de autor en el claustro histórico',
    dateDay: '14',
    dateMonth: 'AGO',
    time: '19:00 - 22:00 HRS',
    location: 'Claustro de las Ánimas',
    city: 'Patio Central',
    description: 'Lectura íntima de poesía vanguardista acompañada de maridaje vinícola selecto y ambientación a la luz de las velas.',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1400&q=80',
    status: 'past',
  },
  {
    title: 'WORKSHOP DE ESCULTURA MONOCROMÁTICA',
    subtitle: 'Taller intensivo de modelado en yeso y arcilla volcánica',
    dateDay: '02',
    dateMonth: 'AGO',
    time: '10:00 - 16:00 HRS',
    location: 'Taller Experimental Lúmen',
    city: 'Estudio 3',
    description: 'Exploración táctil y volumétrica de formas abstractas y texturas rugosas inspiradas en la arquitectura brutalista.',
    imageUrl: 'https://images.unsplash.com/photo-1569783723324-4f4c2df9ca04?auto=format&fit=crop&w=1400&q=80',
    status: 'past',
  },
];

@Injectable()
export class EventService implements OnModuleInit {
  constructor(
    @InjectRepository(EventEntity)
    private readonly EventRepository: Repository<EventEntity>,
    private readonly mailService: MailService,
  ) { }

  async onModuleInit(): Promise<void> {
    try {
      const count = await this.EventRepository.count();
      if (count === 0) {
        for (const item of INITIAL_SEED_EVENTS) {
          const evt = this.EventRepository.create({
            ...item,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          });
          await this.EventRepository.save(evt);
        }
      }
    } catch {}
  }

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

    let events = await this.EventRepository.find({
      where,
      relations: { organizer: { rol: true } },
      order: { createdAt: 'DESC' },
    });

    if (events.length === 0 && (!query || Object.keys(query).length === 0)) {
      try {
        for (const item of INITIAL_SEED_EVENTS) {
          const evt = this.EventRepository.create({
            ...item,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          });
          await this.EventRepository.save(evt);
        }
        events = await this.EventRepository.find({
          relations: { organizer: { rol: true } },
          order: { createdAt: 'DESC' },
        });
      } catch {}
    }

    return events;
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