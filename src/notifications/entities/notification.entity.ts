import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Ticket } from 'src/tickets/ticket.entity';

export type NotificationType =
  | 'ticket_created'
  | 'ticket_assigned'
  | 'status_changed'
  | 'comment_added'
  | 'ticket_confirmed'
  | 'ticket_rejected'
  | 'sla_alert';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  /** Relación a user -> columna real en BD: userid */
  @ManyToOne(() => User, { eager: false, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userid' })
  user: User;

  /** ID derivado (no crea columna, solo lectura) */
  @RelationId((n: Notification) => n.user)
  userId: number;

  /** Relación a ticket -> columna real en BD: ticketid */
  @ManyToOne(() => Ticket, { eager: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketid' })
  ticket: Ticket;

  /** ID derivado (no crea columna, solo lectura) */
  @RelationId((n: Notification) => n.ticket)
  ticketId: number;

  @Column({ type: 'varchar', length: 50 })
  type: NotificationType;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
