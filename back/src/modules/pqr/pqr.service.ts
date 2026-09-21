import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PqrEntity } from './entities/pqr.entity';
import { CreatePqrDto } from './dto/create-pqr.dto';
import { UpdatePqrStatusDto } from './dto/update-pqr-status.dto';
import { GetPqrQueryDto } from './dto/get-pqr-query.dto';
import { AllResponse } from 'src/common/interface/res-all.dto';

@Injectable()
export class PqrService {
    constructor(
        @InjectRepository(PqrEntity)
        private readonly pqrRepository: Repository<PqrEntity>,
    ) { }

    async create(dto: CreatePqrDto): Promise<PqrEntity> {
        const pqr = this.pqrRepository.create(dto);
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
            const pqr = await this.pqrRepository.findOne({ where: { uuid } });
            if (!pqr) throw new NotFoundException('No se encontró esta PQR');
            return pqr;
        },
    };

    async updateStatus(uuid: string, dto: UpdatePqrStatusDto): Promise<PqrEntity> {
        const pqr = await this.findOneBy.uuid(uuid);

        await this.pqrRepository.save({
            index: pqr.index,
            status: dto.status,
            response: dto.response ?? pqr.response,
            respondedAt: dto.response ? new Date() : pqr.respondedAt,
        });

        return this.findOneBy.uuid(uuid);
    }
}