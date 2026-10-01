import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PqrEntity } from './entities/pqr.entity';
import { UserEntity } from '../user/entities/user.entity';
import { CreatePqrDto } from './dto/create-pqr.dto';
import { UpdatePqrStatusDto } from './dto/update-pqr-status.dto';
import { GetPqrQueryDto } from './dto/get-pqr-query.dto';
import { AllResponse } from 'src/common/interface/res-all.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PqrService {
    private readonly logger = new Logger(PqrService.name);

    constructor(
        @InjectRepository(PqrEntity)
        private readonly pqrRepository: Repository<PqrEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private readonly notificationService: NotificationService,
    ) { }

    async create(dto: CreatePqrDto, userAuth?: any): Promise<PqrEntity> {
        const isAnon = !!dto.isAnonymous;
        let linkedUser: UserEntity | null = null;

        if (userAuth?.id || userAuth?.index) {
            const userIndex = userAuth.id ?? userAuth.index;
            linkedUser = await this.userRepository.findOne({ where: { index: userIndex } });
        }

        let fullName = dto.fullName?.trim();
        let email = dto.email?.trim();

        if (isAnon) {
            fullName = 'Ciudadano Anónimo';
            email = 'anonimo@libero.com';
        } else if (linkedUser) {
            fullName = linkedUser.name || userAuth?.username || 'Usuario';
            email = linkedUser.email || userAuth?.email || 'usuario@libero.com';
        } else {
            fullName = fullName || 'Ciudadano';
            email = email || 'contacto@libero.com';
        }

        const pqr = this.pqrRepository.create({
            fullName,
            email,
            phone: dto.phone?.trim() || null,
            type: dto.type,
            subject: dto.subject?.trim(),
            message: dto.message?.trim(),
            isAnonymous: isAnon,
            user: linkedUser || null,
        });

        return this.pqrRepository.save(pqr);
    }

    async findAll(query: GetPqrQueryDto): Promise<AllResponse> {
        const { page = 1, limit = 10, type, status } = query;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (type) where['type'] = type;
        if (status) where['status'] = status;

        const [data, total] = await this.pqrRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
            relations: { user: true },
        });

        return {
            data,
            meta: {
                totalItems: total,
                itemCount: data.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            },
        };
    }

    findOneBy = {
        uuid: async (uuid: string): Promise<PqrEntity> => {
            const pqr = await this.pqrRepository.findOne({
                where: { uuid },
                relations: { user: true },
            });
            if (!pqr) throw new NotFoundException('No se encontró esta PQR');
            return pqr;
        },
    };

    async updateStatus(uuid: string, dto: UpdatePqrStatusDto, moderatorUser?: any): Promise<PqrEntity> {
        const pqr = await this.findOneBy.uuid(uuid);

        pqr.status = dto.status;
        if (dto.response !== undefined) {
            pqr.response = dto.response;
            pqr.respondedAt = dto.response ? new Date() : pqr.respondedAt;
        }

        const updated = await this.pqrRepository.save(pqr);

        // Si la PQR tiene usuario vinculado, generar notificación en su campana
        if (pqr.user?.index) {
            try {
                await this.notificationService.createPqrResponseNotification({
                    userIndex: pqr.user.index,
                    moderatorIndex: moderatorUser?.id ?? moderatorUser?.index,
                    pqrUuid: pqr.uuid,
                    pqrSubject: pqr.subject,
                    pqrStatus: dto.status,
                    pqrResponse: dto.response ?? pqr.response ?? undefined,
                });
            } catch (err: any) {
                this.logger.warn(`No se pudo enviar notificación para PQR ${uuid}: ${err?.message || err}`);
            }
        }

        return this.findOneBy.uuid(uuid);
    }
}