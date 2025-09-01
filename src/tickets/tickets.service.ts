import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Ticket } from 'src/tickets/ticket.entity';
import { UsersService } from 'src/users/users.service';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { User } from 'src/users/entities/user.entity';
import { Categoria } from './ticket.entity';
import { TicketHistory } from 'src/tickets/entities/tickethistory.entity/tickethistory.entity';

const defaultRelations = ['creator', 'usuarioSolicitante', 'assignedTo'];

@Injectable()
export class TicketsService {

  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,

    @InjectRepository(User)
    private userRepo: Repository<User>,


    @InjectRepository(TicketHistory)
    private historyRepo: Repository<TicketHistory>, // <-- ¡AGREGA ESTA LÍNEA!

    private usersService: UsersService,
  ) { }

  async create(ticketDto: {
    archivoNombre?: string[]; // 👈 ahora array
    title: string;
    description: string;
    creatorId: number;
    categoria?: keyof typeof Categoria;
    tipo?: 'requerimiento' | 'incidencia' | 'consulta';
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
      tipo: ticketDto.tipo ?? 'incidencia',
      usuarioSolicitante: usuarioSolicitante,
      archivoNombre: ticketDto.archivoNombre ?? [],
      empresa: creator.empresa
    });

    const saved = await this.ticketRepo.save(ticket);

    return this.ticketRepo.findOne({
      where: { id: saved.id },
      relations: ['creator',
        'usuarioSolicitante',
        'assignedTo',
        'empresa',
        'histories', // 👈 ojo: en tu entity Ticket el campo es histories
        'histories.actualizadoPor',],
    });

  }



  // tickets.service.ts
  // tickets.service.ts
  async findAll(user: { id: number; role: string; empresaId?: number }) {
    console.log(
      'Buscando tickets para rol:',
      user.role,
      'ID:',
      user.id,
      'Empresa:',
      user.empresaId,
    );

    const relations = ['creator', 'usuarioSolicitante', 'assignedTo'];

    let tickets: Ticket[] = [];

    if (user.role === 'admin' || user.role === 'ti') {
      // Admin y TI ven todos los tickets de su empresa
      tickets = await this.ticketRepo.find({
        where: { empresa: { id: user.empresaId } },
        relations,
      });

    } else if (user.role === 'user') {
      // Los usuarios solo ven tickets donde son creator o usuarioSolicitante
      tickets = await this.ticketRepo
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.creator', 'creator')
        .leftJoinAndSelect('ticket.usuarioSolicitante', 'usuarioSolicitante')
        .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
        .leftJoinAndSelect('ticket.histories', 'histories')
        .leftJoinAndSelect('histories.actualizadoPor', 'actualizadoPor')
        .where('ticket.empresaId = :empresaId', { empresaId: user.empresaId })
        .andWhere(
          '(creator.id = :id OR usuarioSolicitante.id = :id)',
          { id: user.id },
        )
        .getMany();
    }

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
      relations: ['creator', 'usuarioSolicitante', 'empresa'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket con id ${id} no encontrado`);
    }

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

  async message(message: string, user: { id: number; username: string; role: "admin" | "user" | "ti"; }) {
    console.log('Mensaje recibido:', message);
  }




  async update(id: number, updateTicketDto: UpdateTicketDto, user: User, archivoNombres?: string[]) {
    console.log('Usuario que actualiza:', user);
    console.log('DTO recibido:', updateTicketDto);

    const cambios: Partial<TicketHistory> = {};

    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['createdBy', 'usuarioSolicitante', 'creator'],
    });


    if (!ticket) {
      console.log('❌ Ticket no encontrado');
      throw new NotFoundException('Ticket no encontrado');
    }

    console.log('Ticket encontrado:', ticket);

    console.log('CREATOR:', ticket.creator);
    console.log('SOLICITANTE:', ticket.usuarioSolicitante);


    if (user.role === 'user') {
      if (!updateTicketDto.message && !archivoNombres) {
        throw new ForbiddenException('Solo puedes agregar un mensaje o adjuntar un archivo');
      }
    }



    if (updateTicketDto.message) {
      ticket.message = updateTicketDto.message;
    }

    if (user.role === 'ti') {
      if (updateTicketDto.status && updateTicketDto.status !== ticket.status) {
        cambios.statusAnterior = ticket.status;
        cambios.statusNuevo = updateTicketDto.status;

        // Solo actualiza si cambió
        ticket.status = updateTicketDto.status;
        console.log('✅ TI actualiza status a:', updateTicketDto.status);
      }

      if (updateTicketDto.prioridad && updateTicketDto.prioridad !== ticket.prioridad) {
        cambios.prioridadAnterior = ticket.prioridad;
        cambios.prioridadNueva = updateTicketDto.prioridad;

        ticket.prioridad = updateTicketDto.prioridad;
        console.log('✅ TI actualiza prioridad a:', updateTicketDto.prioridad);
      }

    } if (archivoNombres) {
      const adjuntosExistentes = await this.historyRepo.count({
        where: { ticket: { id: ticket.id }, adjuntoNombre: Not(IsNull()) },
      });

      if (adjuntosExistentes >= 3) {
        throw new BadRequestException('Máximo 3 archivos adjuntos permitidos');
      }

      cambios.adjuntoNombre = archivoNombres;
    }

    if (Object.keys(cambios).length > 0 ||
      updateTicketDto.message ||
      archivoNombres) {
      const historial = this.historyRepo.create({
        ticket,
        prioridadAnterior: cambios.prioridadAnterior,
        prioridadNueva: cambios.prioridadNueva,
        statusAnterior: cambios.statusAnterior,
        statusNuevo: cambios.statusNuevo,
        mensaje: updateTicketDto.message,
        actualizadoPor: { id: user.id } as any,
        adjuntoNombre: archivoNombres && archivoNombres.length > 0 ? archivoNombres : [],


      });
      await this.historyRepo.save(historial)
        ;
      console.log('📜 Historial guardado:', historial);
    }
 

    return this.ticketRepo.save(ticket);




  }
  async obtenerHistorial(ticketId: number) {
    const historial = await this.historyRepo.find({
      where: { ticket: { id: ticketId } },
      relations: ['ticket', 'actualizadoPor'],
      order: { fecha: 'DESC' },
    });

    return historial.map((h) => ({
      id: h.id,
      fecha: h.fecha,
      email: h.actualizadoPor?.email ?? null, // 👈 devuelve solo email
      statusAnterior: h.statusAnterior,
      statusNuevo: h.statusNuevo,
      prioridadAnterior: h.prioridadAnterior,
      prioridadNueva: h.prioridadNueva,
      mensaje: h.mensaje,
      adjuntoNombre: h.adjuntoNombre,
    }));
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

    const esSolicitante = ticket.usuarioSolicitante?.id === user.id;
    const esCreador = ticket.creator?.id === user.id;

    if (!esSolicitante && !esCreador) {
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



  async rechazarResolucion(ticketId: number, userId: number) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['usuarioSolicitante'],
    });

    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    if (ticket.usuarioSolicitante.id !== userId)
      throw new ForbiddenException('No autorizado');
    if (ticket.status !== 'resuelto')
      throw new BadRequestException('El ticket no está resuelto');
    if (ticket.rechazadoPorUsuario)
      throw new BadRequestException('Ya lo rechazaste');

    // Marca que el usuario rechazó la resolución
    ticket.rechazadoPorUsuario = true;
    ticket.fechaRechazo = new Date();

    // Cambia el estado para que vuelva a revisión del personal de TI
    ticket.status = 'en_espera'; // o el nombre que uses en tu enum de estados

    // Opcional: si quieres resetear confirmación por si acaso
    ticket.confirmadoPorUsuario = false;

    return this.ticketRepo.save(ticket);
  }


  async actualizarRechazo(ticketId: number, estado: boolean) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });

    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    ticket.rechazadoPorUsuario = estado;


    return this.ticketRepo.save(ticket);
  }


}