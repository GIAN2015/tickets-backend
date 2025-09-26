import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
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

  // src/users/entities/user.entity.ts
  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;


  @OneToMany(() => Ticket, (ticket) => ticket.creator)
  createdTickets: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.assignedTo)
  assignedTickets: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.usuarioSolicitante)
  ticketsAsignados: Ticket[];


  @Column({ nullable: true })
  smtpPassword?: string;
  @ManyToOne(() => Empresa, (empresa) => empresa.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @Column({ nullable: true })
  empresaId: number; // 👈 clave foránea para identificar la empresa
  @Column({ default: true })
  isActive: boolean;

}
