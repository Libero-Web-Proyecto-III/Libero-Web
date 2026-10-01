import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitEntity } from './entities/visit.entity';
import { RecordVisitDto } from './dto/record-visit.dto';

export interface TopPageStat {
  path: string;
  visits: number;
  percentage: number;
}

export interface DailyVisitStat {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

export interface VisitStatsResponse {
  totalVisits: number;
  uniqueVisitors: number;
  visitsToday: number;
  uniqueVisitorsToday: number;
  topPages: TopPageStat[];
  recentDays: DailyVisitStat[];
}

@Injectable()
export class VisitService {
  private readonly logger = new Logger(VisitService.name);

  constructor(
    @InjectRepository(VisitEntity)
    private readonly visitRepository: Repository<VisitEntity>,
  ) {}

  async recordVisit(dto: RecordVisitDto, userAgent?: string): Promise<{ success: boolean }> {
    try {
      const sanitizedPath = (dto.path || '/').split('?')[0].trim();
      // Ignorar visitas al panel de administración o recursos estáticos
      if (sanitizedPath.startsWith('/admin') || sanitizedPath.includes('.')) {
        return { success: true };
      }

      const visit = this.visitRepository.create({
        path: sanitizedPath,
        visitorId: dto.visitorId || undefined,
        referrer: dto.referrer ? dto.referrer.slice(0, 255) : undefined,
        userAgent: userAgent ? userAgent.slice(0, 255) : undefined,
      });

      await this.visitRepository.save(visit);
      return { success: true };
    } catch (error) {
      this.logger.error('Error al registrar visita:', error);
      return { success: false };
    }
  }

  async getStats(): Promise<VisitStatsResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total de visitas
    const totalVisits = await this.visitRepository.count();

    // 2. Visitantes únicos totales
    const uniqueTotalResult = await this.visitRepository
      .createQueryBuilder('visit')
      .select('COUNT(DISTINCT visit.visitorId)', 'count')
      .where('visit.visitorId IS NOT NULL')
      .getRawOne<{ count: string | number }>();
    const uniqueVisitors = Number(uniqueTotalResult?.count || 0);

    // 3. Visitas de hoy
    const visitsToday = await this.visitRepository
      .createQueryBuilder('visit')
      .where('visit.createdAt >= :today', { today })
      .getCount();

    // 4. Visitantes únicos de hoy
    const uniqueTodayResult = await this.visitRepository
      .createQueryBuilder('visit')
      .select('COUNT(DISTINCT visit.visitorId)', 'count')
      .where('visit.createdAt >= :today', { today })
      .andWhere('visit.visitorId IS NOT NULL')
      .getRawOne<{ count: string | number }>();
    const uniqueVisitorsToday = Number(uniqueTodayResult?.count || 0);

    // 5. Páginas más visitadas (Top 5)
    const topPagesRaw = await this.visitRepository
      .createQueryBuilder('visit')
      .select('visit.path', 'path')
      .addSelect('COUNT(visit.id)', 'visits')
      .groupBy('visit.path')
      .orderBy('visits', 'DESC')
      .limit(5)
      .getRawMany<{ path: string; visits: string | number }>();

    const topPages: TopPageStat[] = topPagesRaw.map((row) => {
      const visits = Number(row.visits || 0);
      const percentage = totalVisits > 0 ? Math.round((visits / totalVisits) * 100) : 0;
      return {
        path: row.path,
        visits,
        percentage,
      };
    });

    // 6. Historial de últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentDaysRaw = await this.visitRepository
      .createQueryBuilder('visit')
      .select("DATE_FORMAT(visit.createdAt, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(visit.id)', 'visits')
      .addSelect('COUNT(DISTINCT visit.visitorId)', 'uniqueVisitors')
      .where('visit.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy("DATE_FORMAT(visit.createdAt, '%Y-%m-%d')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; visits: string | number; uniqueVisitors: string | number }>();

    // Rellenar días vacíos para asegurar los 7 días
    const recentDaysMap = new Map(
      recentDaysRaw.map((r) => [r.date, { visits: Number(r.visits || 0), unique: Number(r.uniqueVisitors || 0) }]),
    );

    const recentDays: DailyVisitStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const data = recentDaysMap.get(dateStr) || { visits: 0, unique: 0 };
      recentDays.push({
        date: dateStr,
        visits: data.visits,
        uniqueVisitors: data.unique,
      });
    }

    return {
      totalVisits,
      uniqueVisitors,
      visitsToday,
      uniqueVisitorsToday,
      topPages,
      recentDays,
    };
  }
}
