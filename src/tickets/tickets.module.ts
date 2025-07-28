import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './ticket.entity'; // 
import { TicketHistory } from 'src/tickets/entities/ticket-history.entity/ticket-history.entity'; // ✅ tu entidad TicketHistory
import { UsersModule } from 'src/users/users.module'; // 

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TicketHistory]), // 
    UsersModule,
  
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
