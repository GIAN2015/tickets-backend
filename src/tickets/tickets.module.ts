import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Ticket } from './ticket.entity';
import { TicketHistory } from './entities/tickethistory.entity/tickethistory.entity';
import { User } from 'src/users/entities/user.entity';
import { Empresa } from 'src/empresas/entities/empresas.entity';

import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Notification } from 'src/notifications/entities/notification.entity';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      TicketHistory,
      User,
      Empresa,
      Notification,
    ]),
  ],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    UsersService,   // <- usado por TicketsService
    MailService, 
    NotificationsService,   // <- usado por TicketsService
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
