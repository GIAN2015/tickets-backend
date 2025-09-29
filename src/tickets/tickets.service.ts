import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Ticket } from 'src/tickets/ticket.entity';
import { UsersService } from 'src/users/users.service';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { User } from 'src/users/entities/user.entity';
import { Categoria } from './ticket.entity';
import { TicketHistory } from 'src/tickets/entities/tickethistory.entity/tickethistory.entity';
import { MailService } from 'src/mail.service';

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
    private readonly mailService: MailService, // <-- ¡AGREGA ESTA LÍNEA!

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
      empresa: { id: creator.empresaId } as any,
    });

    const saved = await this.ticketRepo.save(ticket);
    const destinatarios: string[] = [];
    if (creator.email) destinatarios.push(creator.email);
    if (usuarioSolicitante?.email) destinatarios.push(usuarioSolicitante.email);

    if (destinatarios.length > 0) {
      try {
        await this.mailService.enviarCorreo(
          creator.empresaId,
          destinatarios,
          `Nuevo Ticket #${saved.id}`,
          `
          <p>Hola,</p>
          <p>Se ha creado un nuevo ticket en el sistema:</p>
          <ul>
            <li><b>Título:</b> ${saved.title}</li>
            <li><b>Descripción:</b> ${saved.description}</li>
            <li><b>Prioridad:</b> ${saved.prioridad}</li>
            <li><b>Categoría:</b> ${saved.categoria}</li>
          </ul>
        `
        );
        console.log("📧 Correo de creación enviado a:", destinatarios);
      } catch (error) {
        console.error("❌ Error al enviar correo de creación:", error.message);
      }
    }

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

    if (user.role === 'super-admi' || user.role === 'admin' || user.role === 'ti') {
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
      relations: ['createdBy', 'usuarioSolicitante', 'creator', 'empresa'],
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

    } if (archivoNombres && archivoNombres.length > 0) {
      cambios.adjuntoNombre = archivoNombres;
    }

    if (cambios.statusNuevo || cambios.prioridadNueva || updateTicketDto.message) {
      const destinatarios: string[] = [];

      if (ticket.usuarioSolicitante?.email) {
        destinatarios.push(ticket.usuarioSolicitante.email);
      }
      if (ticket.creator?.email) {
        destinatarios.push(ticket.creator.email);
      }

      if (user?.email && !destinatarios.includes(user.email)) {
        destinatarios.push(user.email);
      }
      if (destinatarios.length > 0) {
        try {
          await this.mailService.enviarCorreo(
            ticket.empresa.id,
            destinatarios, // 👈 enviamos a todos los correos
            `Actualización del Ticket #${ticket.id}`,
            `
          <p>Hola,</p>
          <p>El ticket <strong>#${ticket.id}</strong> ha sido actualizado.</p>
          ${cambios.statusNuevo ? `<p>Nuevo estado: <b>${cambios.statusNuevo}</b></p>` : ''}
          ${cambios.prioridadNueva ? `<p>Nueva prioridad: <b>${cambios.prioridadNueva}</b></p>` : ''}
          ${updateTicketDto.message ? `<p>Mensaje: "${updateTicketDto.message}"</p>` : ''}
        `
          );
          console.log('📧 Correo enviado a:', destinatarios);
        } catch (error) {
          console.error('❌ Error al enviar correo:', error.message);
        }
      }


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

    // 📧 Notificar al creador que ya hay un TI asignado
    if (ticket.creator?.email) {
      try {
        await this.mailService.enviarCorreo(
          ticket.empresa.id,
          [ticket.creator.email],
          `Ticket #${ticket.id} aceptado 🎉`,
          `
        <p>Tu ticket <b>#${ticket.id}</b> ha sido aceptado por el equipo TI.</p>
        <p>Encargado: <b>${user.username}</b> (${user.email})</p>
      `
        );
      } catch (error) {
        console.error("❌ Error enviando correo de aceptación:", error.message);
      }
    }

    // ✅ Volvemos a buscar el ticket con todas sus relaciones actualizadas
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
    const destinatarios: string[] = [];
    if (ticket.creator?.email) destinatarios.push(ticket.creator.email);
    if (ticket.usuarioSolicitante?.email) destinatarios.push(ticket.usuarioSolicitante.email);

    if (destinatarios.length > 0) {
      try {
        await this.mailService.enviarCorreo(
          ticket.empresa.id,
          destinatarios,
          `Ticket #${ticket.id} confirmado ✅`,
          `
          <p>El ticket <b>#${ticket.id}</b> ha sido confirmado por el usuario.</p>
          <p>Estado final: <b>Completado</b></p>
        `
        );
        console.log("📧 Correo de confirmación enviado a:", destinatarios);
      } catch (error) {
        console.error("❌ Error al enviar correo de confirmación:", error.message);
      }
    }


    return this.ticketRepo.save(ticket);


  }



  async rechazarResolucion(ticketId: number, userId: number) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['usuarioSolicitante', 'empresa', 'creator'], // 👈 agrega creator
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

    // 🔁 vuelve a un estado válido en tu flujo
    ticket.status = 'en proceso'; // <- en vez de 'en_espera'

    const destinatarios: string[] = [];
    if (ticket.creator?.email) destinatarios.push(ticket.creator.email);
    if (ticket.usuarioSolicitante?.email) destinatarios.push(ticket.usuarioSolicitante.email);

    if (destinatarios.length) {
      try {
        await this.mailService.enviarCorreo(
          ticket.empresa.id,
          destinatarios,
          `Ticket #${ticket.id} rechazado ❌`,
          `<p>El ticket <b>#${ticket.id}</b> ha sido <b>rechazado</b> por el usuario.</p>
         <p>El equipo de TI deberá revisarlo nuevamente.</p>`
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
  // src/tickets/tickets.service.ts
  async setSla(
    ticketId: number,
    dto: { dias: number; greenPct?: number; yellowPct?: number; redPct?: number },
    admin: User, // úsalo para validar rol si quieres aquí o en guard
  ) {
    const t = await this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['empresa'] });
    if (!t) throw new NotFoundException('Ticket no encontrado');

    // (sobran si pones @Roles en controller)
    if (admin.role !== 'admin' && admin.role !== 'super-admi') {
      throw new ForbiddenException('Solo admin puede fijar SLA');
    }

    // porcentajes por defecto 60% / 30% / 10%
    const gp = dto.greenPct ?? 0.6;
    const yp = dto.yellowPct ?? 0.3;
    const rp = dto.redPct ?? 0.1;

    // normaliza por si vienen imperfectos (sumar a 1)
    const totalPct = gp + yp + rp || 1;
    const greenPct = gp / totalPct;
    const yellowPct = yp / totalPct;
    const redPct = rp / totalPct;

    const totalMin = dto.dias * 24 * 60;
    const start = new Date(); // empieza a correr cuando el admin lo fija

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


}