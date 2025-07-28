import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Ticket } from 'src/tickets/ticket.entity';

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
  // user.entity.ts
@OneToMany(() => Ticket, (ticket) => ticket.usuarioSolicitante)
ticketsAsignados: Ticket[];

}
