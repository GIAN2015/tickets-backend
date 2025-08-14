// ticket-history.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne,
} from 'typeorm';
import { Ticket } from 'src/tickets/ticket.entity';
import { User } from 'src/users/user.entity';

@Entity()
export class TicketHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ticket, ticket => ticket.histories)
  ticket: Ticket;

  @ManyToOne(() => User, (user) => user.histories, { eager: false })
  actualizadoPor: User;

  @Column({ nullable: true })
  statusAnterior?: string;

  @Column({ nullable: true })
  statusNuevo?: string;

  @Column({ nullable: true })
  prioridadAnterior?: string;

  @Column({ nullable: true })
  prioridadNueva?: string;

  @CreateDateColumn()
  fecha: Date;
  @Column({ type: 'text', nullable: true })
  mensaje?: string;

  @Column({nullable: true})
  adjuntoNombre?: string;  

}
