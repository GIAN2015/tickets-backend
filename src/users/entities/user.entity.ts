import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Ticket } from 'src/tickets/ticket.entity';
import { Empresa } from 'src/empresas/entities/empresas.entity';

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

  @Column()
  role: 'admin' | 'user' | 'ti';

  @OneToMany(() => Ticket, (ticket) => ticket.creator)
  createdTickets: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.assignedTo)
  assignedTickets: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.usuarioSolicitante)
  ticketsAsignados: Ticket[];

  @ManyToOne(() => Empresa, (empresa) => empresa.users, { nullable: true })
  empresa?: Empresa;
  @Column({ nullable: true })
  smtpPassword?: string;

}
