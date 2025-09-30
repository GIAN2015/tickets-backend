import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from 'src/tickets/ticket.entity';
import { Empresa } from 'src/empresas/entities/empresas.entity';
import { Role } from 'src/enums/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  /** Tickets creados por este usuario (inverso de Ticket.creator) */
  @OneToMany(() => Ticket, (ticket) => ticket.creator)
  createdTickets: Ticket[];

  /** Tickets asignados a este usuario como TI (inverso de Ticket.assignedTo) */
  @OneToMany(() => Ticket, (ticket) => ticket.assignedTo)
  assignedTickets: Ticket[];

  /**
   * Tickets donde este usuario es el solicitante/cliente (inverso de Ticket.usuarioSolicitante)
   * (Renombrado para evitar confusión con assignedTickets)
   */
  @OneToMany(() => Ticket, (ticket) => ticket.usuarioSolicitante)
  ticketsSolicitados: Ticket[];

  @ManyToOne(() => Empresa, (empresa) => empresa.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @Column({ nullable: true })
  empresaId: number;

  @Column({ default: true })
  isActive: boolean;

  // Opcional: si usas SMTP por usuario
  @Column({ nullable: true })
  smtpPassword?: string;
}
