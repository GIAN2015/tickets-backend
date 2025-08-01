import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketHistory } from './entities/ticket-history.entity/ticket-history.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { request } from 'http';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  ticketsRepo: any;
  ticketRepository: any;
  constructor(
    private readonly ticketsService: TicketsService,
    @InjectRepository(TicketHistory)
    private readonly historyRepo: Repository<TicketHistory>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) { }

  @Post()
  create(
    @Body() dto: { title: string; description: string },
    @Req() req: RequestWithUser,
  ) {
    return this.ticketsService.create({
      ...dto,
      creatorId: req.user.id,
    });
  }
  // tickets.controller.ts
  @Get()
  async getAll(@Req() req: RequestWithUser) {
    console.log('User que solicita tickets:', req.user);
    const user = req.user as User;
    return this.ticketsService.findAll(user);
  }

  @Get()
  async findAll(@Req() req: RequestWithUser) {
    const user = req.user;

    if (!user) {
      throw new NotFoundException('Usuario no autenticado');
    }


    if (user.role === 'user') {
      return this.ticketsService.findByCreatorId(user.id);
    }

    if (user.role === 'ti') {
      return this.ticketsService.findByAssignedId(user.id);
    }

    return [];
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateTicketDto: UpdateTicketDto,
    @Req() req: RequestWithUser,
  ) {
    const user = await this.usersRepo.findOne({ where: { id: req.user.id } });


    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.ticketsService.update(+id, updateTicketDto, user);
  }

  @Patch(':id/confirmar')
  @UseGuards(JwtAuthGuard)
  async confirmarResolucion(
    @Param('id') id: number,
    @Req() req: RequestWithUser,
  ) {
    const ticketActualizado = await this.ticketsService.confirmarResolucion(+id, req.user);

    console.log('Ticket actualizado desde backend:', ticketActualizado);

    return ticketActualizado;
  }



 @Patch(':id/rechazar')
@UseGuards(JwtAuthGuard)
async rechazarResolucion(
  @Param('id') id: number,
  @Req() req: RequestWithUser,
) {
  return this.ticketsService.rechazarResolucion(+id, req.user);
}


}