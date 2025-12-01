import { Controller, Get, Patch, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  async getMyNotifications(@Req() req: RequestWithUser) {
    return this.notificationsService.getMyNotifications(req.user.id);
  }

  @Get('me/unread-count')
  async getUnreadCount(@Req() req: RequestWithUser) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch('me/read-all')
  async readAll(@Req() req: RequestWithUser) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { ok: true };
  }
}
