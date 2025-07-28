import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { TicketHistory } from './entities/ticket-history.entity/ticket-history.entity';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'no iniciado' })
  status: 'no iniciado' | 'asignado' | 'en proceso' | 'resuelto' | 'completado';

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ default: 'media' })
  prioridad: 'muy_bajo' | 'bajo' | 'media' | 'alta' | 'muy_alta';

  @Column() // <-- Agregado explícitamente
  creatorId: number;

  @ManyToOne(() => User, (user) => user.createdTickets)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @ManyToOne(() => User, (user) => user.assignedTickets, { nullable: true })
  assignedTo?: User;

  @OneToMany(() => Ticket, (ticket) => ticket.creator)
  ticketsCreados: Ticket[];

  @UpdateDateColumn()
  updatedAt: Date;


  @ManyToOne(() => User, (user) => user.ticketsAsignados, { eager: false })
  usuarioSolicitante: User;

  history: any;
  user: any;

  @ManyToOne(() => User, user => user.createdTickets)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

}

