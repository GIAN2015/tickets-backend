// src/users/entities/user.entity.ts
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from 'src/tickets/ticket.entity';

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

  @Column({ type: 'text' }) // SQLite no soporta ENUM
  role: UserRole;
  @ManyToOne(() => User, (user) => user.ticketsCreados)
  @JoinColumn({ name: 'created_by' }) // si tu columna es created_by
  createdBy: User;

  @OneToMany(() => Ticket, (ticket) => ticket.creator)
  createdTickets: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.assignedTo)
  assignedTickets: Ticket[];
  ticketsCreados: any;
}
