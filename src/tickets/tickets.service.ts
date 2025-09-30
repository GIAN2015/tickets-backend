import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Ticket } from 'src/tickets/ticket.entity';
import { UsersService } from 'src/users/users.service';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { User } from 'src/users/entities/user.entity';
import { Categoria } from './ticket.entity';
import { TicketHistory } from 'src/tickets/entities/tickethistory.entity/tickethistory.entity';
import { MailService } from 'src/mail.service';
import { TicketTemplates } from 'src/mail/templates/tickets';

const defaultRelations = ['creator', 'usuarioSolicitante', 'assignedTo'];

@Injectable()
export class TicketsService {

  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(TicketHistory)
    private historyRepo: Repository<TicketHistory>,

    private readonly mailService: MailService,
    private usersService: UsersService,
  ) { }

  async create(ticketDto: {
    archivoNombre?: string[];
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
      empresa: { id: creator.empresaId } as any,
    });

    const saved = await this.ticketRepo.save(ticket);

    // 📩 Notificar a creador/solicitante
    const destinatarios: string[] = [];
    if (creator.email) destinatarios.push(creator.email);
    if (usuarioSolicitante?.email) destinatarios.push(usuarioSolicitante.email);

    if (destinatarios.length > 0) {
      try {
        await this.mailService.enviarCorreo(
          creator.empresaId,
          destinatarios,
          `Nuevo Ticket #${saved.id}`,
          TicketTemplates.creado({
            id: saved.id,
            title: saved.title,
            description: saved.description,
            prioridad: saved.prioridad,
            categoria: saved.categoria,
          })
        );
        console.log('📧 Correo de creación enviado a:', destinatarios);
      } catch (error: any) {
        console.error('❌ Error al enviar correo de creación:', error.message);
      }
    }

    // 🛎️ EXTRA: Notificar a ADMINs (admin / super-admi) de la empresa
    try {
      const admins = await this.userRepo.find({
        where: {
          empresaId: creator.empresaId,
          role: In(['admin', 'super-admi']),
        },
      });

      // Evita duplicar si el admin es también el creador/solicitante
      const adminEmails = (admins || [])
        .map(a => a.email)
        .filter(Boolean) as string[];

      // quita los que ya notificaste arriba
      const alreadyNotified = new Set(destinatarios);
      const adminsToNotify = adminEmails.filter(e => !alreadyNotified.has(e));

      if (adminsToNotify.length > 0) {
        await this.mailService.enviarCorreo(
          creator.empresaId,
          adminsToNotify,
          `Nuevo Ticket #${saved.id} en tu empresa`,
          TicketTemplates.creado({
            id: saved.id,
            title: saved.title,
            description: saved.description,
            prioridad: saved.prioridad,
            categoria: saved.categoria,
          })
        );
        console.log('📧 Correo a ADMINs por ticket creado:', adminsToNotify);
      }
    } catch (e: any) {
      console.error('❌ Error notificando a ADMINs (creación):', e.message || e);
    }

    return this.ticketRepo.findOne({
      where: { id: saved.id },
      relations: [
        'creator',
        'usuarioSolicitante',
        'assignedTo',
        'empresa',
        'histories',
        'histories.actualizadoPor',
      ],
    });
  }



  async findAll(user: { id: number; role: string; empresaId?: number }) {
    if (user.role === 'super-admi' || user.role === 'admin') {
      return this.ticketRepo.createQueryBuilder('t')
        .leftJoinAndSelect('t.creator', 'creator')
        .leftJoinAndSelect('t.usuarioSolicitante', 'usuarioSolicitante')
        .leftJoinAndSelect('t.assignedTo', 'assignedTo')
        .where('t."empresaId" = :empresaId', { empresaId: user.empresaId })
        .orderBy('t."createdAt"', 'DESC')
        .getMany();
    }

    if (user.role === 'ti') {
      return this.ticketRepo.createQueryBuilder('t')
        .leftJoinAndSelect('t.creator', 'creator')
        .leftJoinAndSelect('t.usuarioSolicitante', 'usuarioSolicitante')
        .leftJoinAndSelect('t.assignedTo', 'assignedTo')
        .where('t."assignedToId" = :id', { id: user.id })
        .andWhere('t."empresaId" = :empresaId', { empresaId: user.empresaId })
        .orderBy('t."createdAt"', 'DESC')
        .getMany();
    }

    if (user.role === 'user') {
      return this.ticketRepo.createQueryBuilder('t')
        .leftJoinAndSelect('t.creator', 'creator')
        .leftJoinAndSelect('t.usuarioSolicitante', 'usuarioSolicitante')
        .leftJoinAndSelect('t.assignedTo', 'assignedTo')
        .leftJoinAndSelect('t.histories', 'histories')
        .leftJoinAndSelect('histories.actualizadoPor', 'actualizadoPor')
        .where('t."empresaId" = :empresaId', { empresaId: user.empresaId })
        .andWhere('(creator.id = :id OR usuarioSolicitante.id = :id)', { id: user.id })
        .orderBy('t."createdAt"', 'DESC')
        .getMany();
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
    return this.ticketRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.creator', 'creator')
      .leftJoinAndSelect('t.usuarioSolicitante', 'usuarioSolicitante')
      .leftJoinAndSelect('t.assignedTo', 'assignedTo')
      .where('assignedTo.id = :id', { id: userId })
      .orderBy('t.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number) {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['creator', 'usuarioSolicitante', 'empresa', 'assignedTo'],
    });
    if (!ticket) throw new NotFoundException(`Ticket con id ${id} no encontrado`);
    return ticket;
  }

  async assignToTicket(id: number, userId: number) {
    const ticket = await this.ticketRepo.findOneBy({ id });
    const user = await this.usersService.findById(userId);
    if (!ticket || !user) return null;

    ticket.assignedTo = user;
    return this.ticketRepo.save(ticket);
  }

  async message(message: string, user: { id: number; username: string; role: 'admin' | 'user' | 'ti' }) {
    console.log('Mensaje recibido:', message);
  }

  async update(
    id: number,
    updateTicketDto: UpdateTicketDto,
    user: User,
    archivoNombres?: string[],
  ) {
    // 1) Cargar ticket con relaciones existentes
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['creator', 'usuarioSolicitante', 'assignedTo', 'empresa'],
    });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    // 2) Autorización
    const isAdmin = user.role === 'admin' || user.role === 'super-admi';
    const isCreator = ticket.creator?.id === user.id;
    const isSolicitante = ticket.usuarioSolicitante?.id === user.id;
    const isAssigned = ticket.assignedTo?.id === user.id;

    if (!isAdmin && !isCreator && !isSolicitante && !isAssigned) {
      throw new ForbiddenException('No autorizado a actualizar este ticket');
    }

    // 3) Cambios a registrar
    const cambios: Partial<TicketHistory> = {};

    if (updateTicketDto.status && updateTicketDto.status !== ticket.status) {
      cambios.statusAnterior = ticket.status;
      cambios.statusNuevo = updateTicketDto.status;
      ticket.status = updateTicketDto.status;
    }

    if (updateTicketDto.prioridad && updateTicketDto.prioridad !== ticket.prioridad) {
      cambios.prioridadAnterior = ticket.prioridad;
      cambios.prioridadNueva = updateTicketDto.prioridad;
      ticket.prioridad = updateTicketDto.prioridad;
    }

    if (updateTicketDto.message) {
      ticket.message = updateTicketDto.message;
    }

    if (archivoNombres && archivoNombres.length > 0) {
      cambios.adjuntoNombre = archivoNombres;
    }

    // 4) Correo si hubo cambios
    if (cambios.statusNuevo || cambios.prioridadNueva || updateTicketDto.message || cambios.adjuntoNombre) {
      const destinatarios: string[] = [];

      if (ticket.creator?.email) destinatarios.push(ticket.creator.email);
      if (ticket.usuarioSolicitante?.email) destinatarios.push(ticket.usuarioSolicitante.email);
      if (ticket.assignedTo?.email) destinatarios.push(ticket.assignedTo.email);
      if (user?.email && !destinatarios.includes(user.email)) destinatarios.push(user.email);

      if (destinatarios.length) {
        try {
          await this.mailService.enviarCorreo(
            ticket.empresa.id,
            destinatarios,
            `Actualización del Ticket #${ticket.id}`,
            TicketTemplates.actualizado({
              id: ticket.id,
              title: ticket.title ?? `Ticket #${ticket.id}`,
              newStatus: cambios.statusNuevo,
              newPrioridad: cambios.prioridadNueva,
              message: updateTicketDto.message,
            })
          );
        } catch (error: any) {
          console.error('❌ Error al enviar correo:', error.message);
        }
      }
    }

    // 5) Guardar historial
    if (cambios.statusNuevo || cambios.prioridadNueva || updateTicketDto.message || cambios.adjuntoNombre) {
      const historial = this.historyRepo.create({
        ticket,
        prioridadAnterior: cambios.prioridadAnterior,
        prioridadNueva: cambios.prioridadNueva,
        statusAnterior: cambios.statusAnterior,
        statusNuevo: cambios.statusNuevo,
        mensaje: updateTicketDto.message,
        actualizadoPor: { id: user.id } as any,
        adjuntoNombre: cambios.adjuntoNombre ?? [],
      });
      await this.historyRepo.save(historial);
    }

    // 6) Guardar ticket
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
      email: h.actualizadoPor?.email ?? null,
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
      relations: ['creator', 'usuarioSolicitante'],
    });
  }

  async aceptarTicket(ticketId: number, user: User) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['creator', 'usuarioSolicitante', 'empresa'],
    });

    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    if (ticket.usuarioSolicitante) {
      throw new BadRequestException('Este ticket ya tiene un usuario solicitante asignado');
    }

    // ✅ El TI que acepta pasa a ser el usuarioSolicitante
    ticket.usuarioSolicitante = user;
    await this.ticketRepo.save(ticket);

    // 📧 Notificar al creador
    if (ticket.creator?.email) {
      try {
        await this.mailService.enviarCorreo(
          ticket.empresa.id,
          [ticket.creator.email],
          `Ticket #${ticket.id} aceptado 🎉`,
          TicketTemplates.aceptado(
            { id: ticket.id, title: ticket.title ?? `Ticket #${ticket.id}` },
            user.username,
            user.email
          )
        );
      } catch (error: any) {
        console.error('❌ Error enviando correo de aceptación:', error.message);
      }
    }

    return this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['creator', 'usuarioSolicitante', 'empresa'],
    });
  }

  async confirmarResolucion(ticketId: number, user: { id: number }) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['creator', 'usuarioSolicitante', 'empresa'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const esSolicitante = ticket.usuarioSolicitante?.id === user.id;
    const esCreador = ticket.creator?.id === user.id;

    if (!esSolicitante && !esCreador) {
      throw new ForbiddenException('No puedes confirmar este ticket');
    }

    if (ticket.status !== 'resuelto') {
      throw new BadRequestException('Solo puedes confirmar tickets que están en estado resuelto');
    }

    if (ticket.confirmadoPorUsuario) {
      throw new BadRequestException('Ya confirmaste este ticket');
    }

    ticket.confirmadoPorUsuario = true;
    ticket.fechaConfirmacion = new Date();

    const destinatarios: string[] = [];
    if (ticket.creator?.email) destinatarios.push(ticket.creator.email);
    if (ticket.usuarioSolicitante?.email) destinatarios.push(ticket.usuarioSolicitante.email);

    if (destinatarios.length > 0) {
      try {
        await this.mailService.enviarCorreo(
          ticket.empresa.id,
          destinatarios,
          `Ticket #${ticket.id} confirmado ✅`,
          TicketTemplates.confirmado({
            id: ticket.id,
            title: ticket.title ?? `Ticket #${ticket.id}`,
          })
        );
        console.log('📧 Correo de confirmación enviado a:', destinatarios);
      } catch (error: any) {
        console.error('❌ Error al enviar correo de confirmación:', error.message);
      }
    }

    return this.ticketRepo.save(ticket);
  }

  async rechazarResolucion(ticketId: number, userId: number) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['usuarioSolicitante', 'empresa', 'creator'],
    });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const esSolicitante = ticket.usuarioSolicitante && ticket.usuarioSolicitante.id === userId;
    const esCreador = ticket.creator && ticket.creator.id === userId;

    if (!esSolicitante && !esCreador) {
      throw new ForbiddenException('No autorizado');
    }

    if (ticket.status !== 'resuelto') {
      throw new BadRequestException('El ticket no está resuelto');
    }
    if (ticket.rechazadoPorUsuario) {
      throw new BadRequestException('Ya lo rechazaste');
    }

    ticket.rechazadoPorUsuario = true;
    ticket.fechaRechazo = new Date();
    ticket.confirmadoPorUsuario = false;
    ticket.status = 'en proceso';

    const destinatarios: string[] = [];
    if (ticket.creator?.email) destinatarios.push(ticket.creator.email);
    if (ticket.usuarioSolicitante?.email) destinatarios.push(ticket.usuarioSolicitante.email);

    if (destinatarios.length) {
      try {
        await this.mailService.enviarCorreo(
          ticket.empresa.id,
          destinatarios,
          `Ticket #${ticket.id} rechazado ❌`,
          TicketTemplates.rechazado({
            id: ticket.id,
            title: ticket.title ?? `Ticket #${ticket.id}`,
            status: ticket.status,
          })
        );
      } catch (e: any) {
        console.error('❌ Error al enviar correo de rechazo:', e.message);
      }
    }

    return this.ticketRepo.save(ticket);
  }

  async actualizarRechazo(ticketId: number, estado: boolean) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    ticket.rechazadoPorUsuario = estado;
    return this.ticketRepo.save(ticket);
  }

  async setSla(
    ticketId: number,
    dto: { dias: number; greenPct?: number; yellowPct?: number; redPct?: number },
    admin: User,
  ) {
    const t = await this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['empresa'] });
    if (!t) throw new NotFoundException('Ticket no encontrado');

    if (admin.role !== 'admin' && admin.role !== 'super-admi') {
      throw new ForbiddenException('Solo admin puede fijar SLA');
    }

    const gp = dto.greenPct ?? 0.6;
    const yp = dto.yellowPct ?? 0.3;
    const rp = dto.redPct ?? 0.1;

    const totalPct = gp + yp + rp || 1;
    const greenPct = gp / totalPct;
    const yellowPct = yp / totalPct;
    const redPct = rp / totalPct;

    const totalMin = dto.dias * 24 * 60;
    const start = new Date();

    const greenEndMs = start.getTime() + Math.round(totalMin * greenPct) * 60_000;
    const yellowEndMs = start.getTime() + Math.round(totalMin * (greenPct + yellowPct)) * 60_000;
    const deadlineMs = start.getTime() + totalMin * 60_000;

    t.slaTotalMinutos = totalMin;
    t.slaStartAt = start;
    t.slaGreenEndAt = new Date(greenEndMs);
    t.slaYellowEndAt = new Date(yellowEndMs);
    t.deadlineAt = new Date(deadlineMs);

    await this.ticketRepo.save(t);
    return t;
  }

  async asignarTi(ticketId: number, tiUserId: number, admin: User) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['empresa', 'creator', 'usuarioSolicitante', 'assignedTo'],
    });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    if (admin.role !== 'admin' && admin.role !== 'super-admi') {
      throw new ForbiddenException('No autorizado');
    }

    const ti = await this.userRepo.findOne({ where: { id: tiUserId } });
    if (!ti) throw new NotFoundException('Usuario TI no encontrado');
    if (ti.role !== 'ti') throw new BadRequestException('El usuario seleccionado no es TI');

    if (ticket.empresa?.id && ti.empresaId && ticket.empresa.id !== ti.empresaId) {
      throw new ForbiddenException('TI no pertenece a la misma empresa');
    }

    ticket.assignedTo = ti;
    ticket.status = 'asignado';

    await this.ticketRepo.save(ticket);

    // 🔔 1) Avisar al TI asignado
    try {
      if (ti.email) {
        await this.mailService.enviarCorreo(
          ticket.empresa.id,
          [ti.email],
          `Te asignaron el Ticket #${ticket.id}`,
          TicketTemplates.asignado(
            { id: ticket.id, title: ticket.title ?? `Ticket #${ticket.id}` },
            ti.username,
            ti.email
          )
        );
        console.log('📧 Notificación enviada al TI asignado:', ti.email);
      }
    } catch (e: any) {
      console.error('❌ Error notificando al TI asignado:', e.message || e);
    }

    // 🔔 2) (Opcional) Avisar a creador y solicitante
    try {
      const notifDest = [
        ticket.creator?.email,
        ticket.usuarioSolicitante?.email,
      ].filter(Boolean) as string[];

      if (notifDest.length) {
        await this.mailService.enviarCorreo(
          ticket.empresa.id,
          notifDest,
          `Ticket #${ticket.id} asignado a ${ti.username}`,
          TicketTemplates.asignado(
            { id: ticket.id, title: ticket.title ?? `Ticket #${ticket.id}` },
            ti.username,
            ti.email
          )
        );
        console.log('📧 Notificación a creador/solicitante:', notifDest);
      }
    } catch (e: any) {
      console.error('❌ Error notificando a creador/solicitante:', e.message || e);
    }

    return this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['creator', 'usuarioSolicitante', 'assignedTo', 'empresa'],
    });
  }

}
