import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { Ticket } from 'src/tickets/ticket.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  /**
   * Crea notificaciones internas para creator / usuarioSolicitante / assignedTo
   * (excluyendo al actor que ejecutó la acción).
   */
  async notifyTicketUpdate(
    ticket: Ticket,
    actorId: number,
    type: NotificationType,
    customMessage?: string,
  ) {
    const recipientIds: number[] = [];

    // Robusto: toma el id desde RelationId o desde la relación cargada
    const creatorId =
      (ticket as any).creatorId ?? ticket['creator']?.id ?? null;
    const solicitanteId =
      (ticket as any).usuarioSolicitanteId ?? ticket['usuarioSolicitante']?.id ?? null;
    const assignedToId =
      (ticket as any).assignedToId ?? ticket['assignedTo']?.id ?? null;

    if (creatorId) recipientIds.push(creatorId);
    if (solicitanteId) recipientIds.push(solicitanteId);
    if (assignedToId) recipientIds.push(assignedToId);

    const finalRecipients = [...new Set(recipientIds)].filter(
      (id) => id && id !== actorId,
    );
    if (!finalRecipients.length) return;

    const message = customMessage ?? this.buildDefaultMessage(type, ticket);

    const entities = finalRecipients.map((uid) =>
      this.notifRepo.create({
        user:   { id: uid } as any,          // -> mapea a columna userid
        ticket: { id: (ticket as any).id } as any, // -> mapea a columna ticketid
        type,
        message,
      }),
    );

    await this.notifRepo.save(entities);
  }

  private buildDefaultMessage(type: NotificationType, ticket: Ticket): string {
    const title = (ticket as any).title ?? '';
    const status = (ticket as any).status ?? '';
    switch (type) {
      case 'ticket_created':
        return `Se creó el Ticket #${(ticket as any).id}: ${title}`;
      case 'ticket_assigned':
        return `El Ticket #${(ticket as any).id} fue asignado a un técnico.`;
      case 'status_changed':
        return `El Ticket #${(ticket as any).id} cambió de estado a "${status}".`;
      case 'comment_added':
        return `Nuevo comentario en el Ticket #${(ticket as any).id}.`;
      case 'ticket_confirmed':
        return `El Ticket #${(ticket as any).id} fue confirmado por el usuario.`;
      case 'ticket_rejected':
        return `El Ticket #${(ticket as any).id} fue rechazado por el usuario.`;
      case 'sla_alert':
        return `El SLA del Ticket #${(ticket as any).id} está por vencer.`;
      default:
        return `Actualización en el Ticket #${(ticket as any).id}.`;
    }
  }

  async getMyNotifications(userId: number) {
    // TypeORM traducirá a WHERE userid = :userId
    return this.notifRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 30,
      relations: ['ticket'],
    });
  }

  async getUnreadCount(userId: number) {
    return this.notifRepo.count({
      where: { user: { id: userId }, isRead: false },
    });
  }

  async markAllAsRead(userId: number) {
    await this.notifRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('userid = :userId AND "isRead" = false', { userId })
      .execute();
  }
}
