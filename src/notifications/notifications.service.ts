// src/notifications/notifications.service.ts
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

  async notifyTicketUpdate(
    ticket: Ticket,
    actorId: number,                 // 👈 SOLO EL ID
    type: NotificationType,
    customMessage?: string,
  ) {
    const recipientIds: number[] = [];

    // 👉 usando tus columnas del Ticket
    if (ticket.creatorId) recipientIds.push(ticket.creatorId);
    if (ticket.usuarioSolicitanteId) recipientIds.push(ticket.usuarioSolicitanteId);
    if (ticket.assignedToId) recipientIds.push(ticket.assignedToId);

    // quitar duplicados y al que hizo la acción
    const finalRecipients = [...new Set(recipientIds)].filter(
      (id) => id !== actorId,
    );

    if (!finalRecipients.length) return;

    const message = customMessage ?? this.buildDefaultMessage(type, ticket);

    const entities = finalRecipients.map((userId) =>
      this.notifRepo.create({
        userId,
        ticketId: ticket.id,
        type,
        message,
      }),
    );

    await this.notifRepo.save(entities);
  }

  private buildDefaultMessage(type: NotificationType, ticket: Ticket): string {
    switch (type) {
      case 'ticket_created':
        return `Se creó el Ticket #${ticket.id}: ${ticket['title'] ?? ''}`;
      case 'ticket_assigned':
        return `El Ticket #${ticket.id} fue asignado a un técnico.`;
      case 'status_changed':
        return `El Ticket #${ticket.id} cambió de estado a "${ticket['status']}".`;
      case 'comment_added':
        return `Nuevo comentario en el Ticket #${ticket.id}.`;
      case 'ticket_confirmed':
        return `El Ticket #${ticket.id} fue confirmado por el usuario.`;
      case 'ticket_rejected':
        return `El Ticket #${ticket.id} fue rechazado por el usuario.`;
      case 'sla_alert':
        return `El SLA del Ticket #${ticket.id} está por vencer.`;
      default:
        return `Actualización en el Ticket #${ticket.id}.`;
    }
  }

  async getMyNotifications(userId: number) {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }

  async getUnreadCount(userId: number) {
    return this.notifRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAllAsRead(userId: number) {
    await this.notifRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }
}
