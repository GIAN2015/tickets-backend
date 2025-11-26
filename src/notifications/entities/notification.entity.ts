// src/notifications/entities/notification.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity'; // ajusta el path si hace falta
import { Ticket } from 'src/tickets/ticket.entity';

export type NotificationType =
    | 'ticket_created'
    | 'ticket_assigned'
    | 'status_changed'
    | 'comment_added'
    | 'ticket_confirmed'
    | 'ticket_rejected'
    | 'sla_alert';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'userId' })
    user: User;


    @Column()
    ticketId: number;

    @ManyToOne(() => Ticket, { eager: true })
    @JoinColumn({ name: 'ticketId' })
    ticket: Ticket;

    @Column({ type: 'varchar' })
    type: NotificationType;

    @Column({ type: 'text' })
    message: string;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
