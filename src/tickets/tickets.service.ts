import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from 'src/tickets/ticket.entity';
import { UsersService } from 'src/users/users.service';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { User } from 'src/users/entities/user.entity'; // ✅ Import correcto del User

@Injectable()
export class TicketsService {

  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,

    @InjectRepository(User)
    private userRepo: Repository<User>, // ✅ Asegúrate que está importado

    private usersService: UsersService,
  ) { }

  async create(ticketDto: {
    title: string;
    description: string;
    creatorId: number;
    usuarioSolicitanteId?: number;
    prioridad?: 'muy_bajo' | 'bajo' | 'media' | 'alta' | 'muy_alta' ;
  }) {
    const creator = await this.usersService.findById(ticketDto.creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    let usuarioSolicitante: User | undefined = undefined;
    if (ticketDto.usuarioSolicitanteId) {
      const found = await this.usersService.findById(ticketDto.usuarioSolicitanteId);
      if (!found) {
        throw new Error('Usuario solicitante no encontrado');
      }
      usuarioSolicitante = found;
    }

    const ticket = this.ticketRepo.create({
      title: ticketDto.title,
      description: ticketDto.description,
      prioridad: ticketDto.prioridad ?? 'media',
      creator: creator, // Cambiado de 'createdBy' a 'creator'
      usuarioSolicitante,
    });

    return this.ticketRepo.save(ticket);
  }






  // tickets.service.ts
  async findAll(user: User) {
    console.log('Buscando tickets para rol:', user.role, 'ID:', user.id);

    const relations = ['creator', 'usuarioSolicitante'];

    if (user.role === 'admin') {
      return this.ticketRepo.find({ relations });
    }

    if (user.role === 'user') {
      return this.ticketRepo.find({
        where: { creator: { id: user.id } },
        relations,
      });
    }

    if (user.role === 'ti') {
      return this.ticketRepo.find({
        relations,
      });
    }


    return [];
  }




  async findByCreatorId(userId: number) {
    return this.ticketRepo.find({
      where: { creator: { id: userId } },
      relations: ['creator', 'usuarioSolicitante'],
    });
  }

  async findByAssignedId(userId: number) {
    return this.ticketRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.creator', 'creator')
      .leftJoinAndSelect('ticket.usuarioSolicitante', 'usuarioSolicitante')
      .where('usuarioSolicitante.id = :id', { id: userId })
      .getMany();
  }



  async findOne(id: number) {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['creator', 'assignedTo'],
    });

    // No se debe crear un registro de historial al consultar un ticket
    return ticket;
  }


  async assignToTicket(id: number, userId: number) {
    const ticket = await this.ticketRepo.findOneBy({ id });
    const user = await this.usersService.findById(userId);
    if (!ticket || !user) return null;

    ticket.assignedTo = user;
    return this.ticketRepo.save(ticket);
  }


  async update(id: number, updateTicketDto: UpdateTicketDto, user: User) {
    console.log('Usuario que actualiza:', user);
    console.log('DTO recibido:', updateTicketDto);

    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo'],
    });

    if (!ticket) {
      console.log('❌ Ticket no encontrado');
      throw new NotFoundException('Ticket no encontrado');
    }

    console.log('Ticket encontrado:', ticket);

    if (user.role === 'user') {
      if (ticket.createdBy.id !== user.id) {
        console.log('❌ Usuario no es el creador del ticket');
        throw new ForbiddenException('No tienes permiso para modificar este ticket');
      }

      if (ticket.assignedTo) {
        console.log('❌ Ticket ya asignado, no se puede cambiar prioridad');
        throw new BadRequestException('No puedes cambiar la prioridad de un ticket asignado');
      }

      if (updateTicketDto.status) {
        ticket.status = updateTicketDto.status;
      }

      if (updateTicketDto.prioridad) {
        ticket.prioridad = updateTicketDto.prioridad;
      }



      if (updateTicketDto.status) {
        console.log('✅ Actualizando status a:', updateTicketDto.status);
        ticket.status = updateTicketDto.status;
      }
    } else if (user.role === 'admin') {
      if (updateTicketDto.status) {
        console.log('✅ Admin actualiza status a:', updateTicketDto.status);
        ticket.status = updateTicketDto.status;
      }

      if (updateTicketDto.prioridad) {
        console.log('✅ Admin actualiza prioridad a:', updateTicketDto.prioridad);
        ticket.prioridad = updateTicketDto.prioridad;
      }
    } Object.assign(ticket, updateTicketDto);

    return this.ticketRepo.save(ticket);
  }




  async findOneWithUser(id: number) {
    return this.ticketRepo.findOne({
      where: { id },
      relations: ['creator', 'assignedTo'], // Asegúrate de tener esta relación en tu entidad
    });
  }

}

