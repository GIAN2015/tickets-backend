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
import { Empresa } from 'src/empresas/entities/empresas.entity';

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
  status: 'no iniciado' | 'asignado' | 'en proceso' | 'en_espera' | 'resuelto' | 'completado';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ default: 'media' })
  prioridad: 'muy_bajo' | 'bajo' | 'media' | 'alta' | 'muy_alta';

  /* ===== CREATOR ===== */
  @Column()
  creatorId: number;

  @ManyToOne(() => User, (user) => user.createdTickets, { eager: true })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  /* ===== ASIGNADO A (TI) ===== */
  @ManyToOne(() => User, (user) => user.assignedTickets, { nullable: true, eager: true })
  @JoinColumn({ name: 'assignedToId' })            // 👈 nombre de la columna FK
  assignedTo?: User | null;

  @Column({ type: 'int', nullable: true })         // 👈 columna real en DB
  assignedToId?: number | null;


  /* ===== USUARIO SOLICITANTE (cliente/solicitante) ===== */
  @Column({ nullable: true })
  usuarioSolicitanteId?: number;

  // OJO: en User la inversa debe ser "ticketsSolicitados"
  @ManyToOne(() => User, (user) => user.ticketsSolicitados, { nullable: true, eager: true })
  @JoinColumn({ name: 'usuarioSolicitanteId' })
  usuarioSolicitante?: User;

  /* ===== OTROS CAMPOS ===== */
  @Column({ default: 'incidencia' })
  tipo: 'requerimiento' | 'incidencia' | 'consulta';

  @Column({ default: false })
  confirmadoPorUsuario: boolean;

  @Column({ nullable: true })
  fechaConfirmacion?: Date;

  @Column({ default: false })
  rechazadoPorUsuario: boolean;

  @Column({ nullable: true })
  fechaRechazo?: Date;

  @Column('simple-json', { nullable: true })
  archivoNombre?: string[];

  @Column('simple-json', { nullable: true })
  adjuntoNombre?: string[];

  @Column({ nullable: true })
  message?: string;

  @OneToMany(() => TicketHistory, (history) => history.ticket)
  histories: TicketHistory[];

  @ManyToOne(() => Empresa, (empresa) => empresa.tickets, { onDelete: 'CASCADE', eager: true })
  empresa: Empresa;

  @Column({ type: 'text', default: Categoria.OTROS })
  categoria: Categoria;

  /* ===== SLA ===== */
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
}
