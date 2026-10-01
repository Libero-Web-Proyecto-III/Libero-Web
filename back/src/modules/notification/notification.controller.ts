import { Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { PRIVATE } from 'src/common/decorator/private.decorator';
import { NotificationEntity } from './entities/notification.entity';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @PRIVATE()
  @Get()
  @ApiOperation({
    summary: 'Obtener notificaciones activas del usuario (menores a 3 días)',
  })
  @ApiResponse({ status: 200, description: 'Listado de notificaciones', type: [NotificationEntity] })
  findAll(@Req() req: any) {
    const userIndex = Number(req.user?.id ?? req.user?.index);
    return this.notificationService.findForUser(userIndex);
  }

  @PRIVATE()
  @Get('unread-count')
  @ApiOperation({
    summary: 'Obtener número de notificaciones no leídas',
  })
  async getUnreadCount(@Req() req: any) {
    const userIndex = Number(req.user?.id ?? req.user?.index);
    const count = await this.notificationService.getUnreadCount(userIndex);
    return { count };
  }

  @PRIVATE()
  @Patch(':uuid/read')
  @ApiOperation({
    summary: 'Marcar una notificación como leída',
  })
  markAsRead(@Param('uuid') uuid: string, @Req() req: any) {
    const userIndex = Number(req.user?.id ?? req.user?.index);
    return this.notificationService.markAsRead(uuid, userIndex);
  }

  @PRIVATE()
  @Post('read-all')
  @ApiOperation({
    summary: 'Marcar todas las notificaciones como leídas',
  })
  markAllAsRead(@Req() req: any) {
    const userIndex = Number(req.user?.id ?? req.user?.index);
    return this.notificationService.markAllAsRead(userIndex);
  }

  @PRIVATE()
  @Delete(':uuid')
  @ApiOperation({
    summary: 'Eliminar una notificación',
  })
  remove(@Param('uuid') uuid: string, @Req() req: any) {
    const userIndex = Number(req.user?.id ?? req.user?.index);
    return this.notificationService.remove(uuid, userIndex);
  }
}
