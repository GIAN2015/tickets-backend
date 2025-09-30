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
import { TicketHistory } from 'src/tickets/entities/tickethistory.entity/tickethistory.entity';

export enum Categoria {
  MANTENIMIENTO = 'MANTENIMIENTO',
  HARDWARE = 'HARDWARE',
  SOFTWARE = 'SOFTWARE',
  REDES = 'REDES',
  OTROS = 'OTROS',
}

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

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ default: 'media' })
  prioridad: 'muy_bajo' | 'bajo' | 'media' | 'alta' | 'muy_alta';

  // --- Creador
  @Column()
  creatorId: number;

  @ManyToOne(() => User, (user) => user.createdTickets, { eager: false })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  // --- TI asignado (¡clave!)
  @ManyToOne(() => User, (user) => user.assignedTickets, { nullable: true, eager: true })
  @JoinColumn({ name: 'assignedToId' })            // 👈 nombre de la columna FK
  assignedTo?: User | null;

  @Column({ type: 'int', nullable: true })         // 👈 columna real en DB
  assignedToId?: number | null;

  // --- Usuario solicitante (usuario final)
  @Column({ nullable: true })
  usuarioSolicitanteId: number | null;

  @ManyToOne(() => User, (user) => user.ticketsSolicitados, { eager: false, nullable: true })
  @JoinColumn({ name: 'usuarioSolicitanteId' })
  usuarioSolicitante: User | null;

  // ❌ Quitar esto (esta relación pertenece al User, no aquí)
  // @OneToMany(() => Ticket, (ticket) => ticket.creator)
  // ticketsCreados: Ticket[];

  @Column('simple-json', { nullable: true })
  archivoNombre?: string[];

  @Column({ nullable: true })
  message: string;

  @OneToMany(() => TicketHistory, (history) => history.ticket)
  histories: TicketHistory[];

  @Column({
    type: 'text',
    default: Categoria.OTROS,
  })
  categoria: Categoria;

  // SLA
  @Column({ type: 'int', nullable: true })
  slaTotalMinutos?: number;

  @Column({ type: 'timestamptz', nullable: true })
  slaStartAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  slaGreenEndAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  slaYellowEndAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deadlineAt?: Date;

  // Confirmaciones
  @Column({ default: false })
  confirmadoPorUsuario: boolean;

  @Column({ nullable: true })
  fechaConfirmacion: Date;

  @Column({ default: false })
  rechazadoPorUsuario: boolean;

  @Column({ nullable: true })
  fechaRechazo: Date;
}
