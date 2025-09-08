import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './ticket.entity'; // 
import { TicketHistory } from 'src/tickets/entities/tickethistory.entity/tickethistory.entity'; // ✅ tu entidad TicketHistory
import { UsersModule } from 'src/users/users.module'; // 
import { Empresa } from 'src/empresas/entities/empresas.entity';
import { MailModule } from 'src/mail.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TicketHistory, Empresa]), // 
    UsersModule,MailModule
  
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
