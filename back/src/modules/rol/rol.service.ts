import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RolEntity } from "./entities/rol.entity";
import { Repository } from "typeorm";


@Injectable()
export class RolService {
    constructor(
        @InjectRepository(RolEntity)
        private readonly rolRepository: Repository<RolEntity>
    ) {}

    async findOne(name: string): Promise<RolEntity> {
        const rol = await this.rolRepository.findOneBy({ name })

        if (!rol) throw new NotFoundException('Rol not found')
            return rol
    }

}