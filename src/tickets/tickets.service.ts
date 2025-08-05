import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from 'src/tickets/ticket.entity';
import { UsersService } from 'src/users/users.service';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { User } from 'src/users/entities/user.entity';
import { Categoria } from './ticket.entity';
@Injectable()
export class TicketsService {

  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private usersService: UsersService,
  ) { }

  async create(ticketDto: {
    title: string;
    description: string;
    creatorId: number;
    categoria?: keyof typeof Categoria;
    usuarioSolicitanteId?: number;
    prioridad?: 'muy_bajo' | 'bajo' | 'media' | 'alta' | 'muy_alta';
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

    // ✅ Validar categoría
    const categoriaUpper = ticketDto.categoria?.toUpperCase();
    const categoriaValida = Object.values(Categoria).includes(categoriaUpper as Categoria)
      ? (categoriaUpper as Categoria)
      : Categoria.OTROS;

    // ✅ Crear el ticket
    const ticket = this.ticketRepo.create({
      title: ticketDto.title,
      description: ticketDto.description,
      prioridad: ticketDto.prioridad ?? 'media',
      categoria: categoriaValida,
      creator: creator,
      usuarioSolicitante: usuarioSolicitante,
    });

    const saved = await this.ticketRepo.save(ticket);
    console.log('Ticket guardado:', saved);
    return saved;
  }



  // tickets.service.ts
  async findAll(user: User) {
    console.log('Buscando tickets para rol:', user.role, 'ID:', user.id);

    const relations = ['creator', 'usuarioSolicitante'];

    let tickets: Ticket[] = [];

    if (user.role === 'admin') {
      tickets = await this.ticketRepo.find({ relations });
    } else if (user.role === 'user') {
      tickets = await this.ticketRepo
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.creator', 'creator')
        .leftJoinAndSelect('ticket.usuarioSolicitante', 'usuarioSolicitante')
        .where('creator.id = :id', { id: user.id })
        .orWhere('usuarioSolicitante.id = :id', { id: user.id })
        .getMany();

    } else if (user.role === 'ti') {
      tickets = await this.ticketRepo.find({ relations });
    }

    // 👇 DEBUG: revisa que venga confirmadoPorUsuario
    console.log('Tickets enviados:', tickets.map(t => ({
      id: t.id,
      status: t.status,
      confirmadoPorUsuario: t.confirmadoPorUsuario,
    })));

    return tickets;
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
      relations: ['creator', 'usuarioSolicitante'],
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
      relations: ['createdBy', 'usuarioSolicitante'],
    });

    if (!ticket) {
      console.log('❌ Ticket no encontrado');
      throw new NotFoundException('Ticket no encontrado');
    }

    console.log('Ticket encontrado:', ticket);

    // 👉 BLOQUE USUARIO NORMAL (NO PUEDE CAMBIAR STATUS NI PRIORIDAD)
    if (user.role === 'user') {
      if (ticket.createdBy.id !== user.id) {
        throw new ForbiddenException('No tienes permiso para modificar este ticket');
      }

      throw new ForbiddenException('No puedes modificar el estado o la prioridad de este ticket');
    }

    // 👉 BLOQUE PERSONAL TI
    if (user.role === 'ti') {
      if (updateTicketDto.status) {
        // ⛔ No permitir marcar como completado si el usuario no ha confirmado
        if (updateTicketDto.status === 'completado' && !ticket.confirmadoPorUsuario) {
          throw new BadRequestException('El ticket no ha sido confirmado por el usuario aún');
        }

        ticket.status = updateTicketDto.status;
        console.log('✅ TI actualiza status a:', updateTicketDto.status);
      }

      if (updateTicketDto.prioridad) {
        ticket.prioridad = updateTicketDto.prioridad;
        console.log('✅ TI actualiza prioridad a:', updateTicketDto.prioridad);
      }
    }

    return this.ticketRepo.save(ticket);
  }



  async findOneWithUser(id: number) {
    return this.ticketRepo.findOne({
      where: { id },
      relations: ['creator', 'usuarioSolicitante'], // Asegúrate de tener esta relación en tu entidad
    });
  }

  async confirmarResolucion(ticketId: number, user: { id: number }) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['creator', 'usuarioSolicitante'],
    });

    console.log('Ticket encontrado:', ticket);
    console.log('Usuario autenticado:', user);

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (ticket.creator.id !== user.id) {
      throw new ForbiddenException('No puedes confirmar este ticket');
    }

    console.log('Estado del ticket:', ticket.status);
    console.log('Confirmado por usuario:', ticket.confirmadoPorUsuario);

    if (ticket.status !== 'resuelto') {
      throw new BadRequestException('Solo puedes confirmar tickets que están en estado resuelto');
    }

    if (ticket.confirmadoPorUsuario) {
      throw new BadRequestException('Ya confirmaste este ticket');
    }
    console.log('Tipo de confirmadoPorUsuario:', typeof ticket.confirmadoPorUsuario);
    console.log('Valor de confirmadoPorUsuario:', ticket.confirmadoPorUsuario);

    ticket.confirmadoPorUsuario = true;
    ticket.fechaConfirmacion = new Date();
    return this.ticketRepo.save(ticket);
  }



  async rechazarResolucion(ticketId: number, user: { id: number }) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['creator', 'usuarioSolicitante'],
    });

    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    if (ticket.creator.id !== user.id) throw new ForbiddenException('No autorizado');
    if (ticket.status !== 'resuelto') throw new BadRequestException('El ticket no está resuelto');
    if (ticket.rechazadoPorUsuario) throw new BadRequestException('Ya lo rechazaste');

    ticket.rechazadoPorUsuario = true;
    ticket.fechaRechazo = new Date();

    return this.ticketRepo.save(ticket);
  }

  async actualizarRechazo(id: number, valor: boolean) {
    const ticket = await this.ticketRepo.findOneBy({ id });

    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    ticket.rechazadoPorUsuario = valor;
    return this.ticketRepo.save(ticket);
  }



}

