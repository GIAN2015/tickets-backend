// src/users/entities/user.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { Empresa } from 'src/empresas/entities/empresas.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  TI = 'ti',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column()
  password: string;

  // como SQLite no soporta ENUM nativo, usamos text
  @Column({ type: 'text', default: UserRole.USER })
  role: UserRole;

  // 🔗 Relación con Empresa
  @ManyToOne(() => Empresa, (empresa) => empresa.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @Column({nullable:true})
  empresaId: number; // 👈 clave foránea para identificar la empresa

  // 🔗 Relación con Tickets creados
  @OneToMany(() => Ticket, (ticket) => ticket.creator)
  createdTickets: Ticket[];

  // 🔗 Relación con Tickets asignados
  @OneToMany(() => Ticket, (ticket) => ticket.assignedTo)
  assignedTickets: Ticket[];

  histories: any;
}
