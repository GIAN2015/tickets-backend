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
  @Column({ nullable: true })
  statusAnterior?: string;
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




  @UpdateDateColumn()
  updatedAt: Date;

  // Después del campo 'status' o donde consideres conveniente
  @Column({ default: 'incidencia' })
  tipo: 'requerimiento' | 'incidencia' | 'consulta';

  @Column({ default: false })
  confirmadoPorUsuario: boolean;

  @Column({ nullable: true })
  fechaConfirmacion: Date; // opcional

  @Column({ default: false })
  rechazadoPorUsuario: boolean;


  @Column({ nullable: true })
  fechaRechazo: Date; // opcional

  @Column({ nullable: true })
  usuarioSolicitanteId: number;

  @ManyToOne(() => User, (user) => user.ticketsAsignados, { eager: true, nullable: true })
  @JoinColumn({ name: 'usuarioSolicitanteId' })
  usuarioSolicitante: User;

  @ManyToOne(() => User, user => user.createdTickets)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ nullable: true })
  archivoNombre?: string;

  @Column({ nullable: true })
  adjuntoNombre?: string;

  @Column({ nullable: true })
  message: string;

  @OneToMany(() => TicketHistory, history => history.ticket)
  histories: TicketHistory[];

  @ManyToOne(() => Empresa, (empresa) => empresa.tickets, { onDelete: 'CASCADE' })
  empresa: Empresa;

  @Column({
    type: 'text', // SQLite no soporta enum nativo
    default: Categoria.OTROS,
  })
  categoria: Categoria;

}