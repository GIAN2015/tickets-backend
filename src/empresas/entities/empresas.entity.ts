// src/empresas/entities/empresa.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ticket } from 'src/tickets/ticket.entity';

@Entity()
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  razonSocial: string;

  @Column()
  telefono: string; // teléfono

  @Column()
  correoContacto: string;

  @Column()
  ruc: string;

  @Column({ nullable: true })
  logo: string; // ruta del archivo de imagen

  @OneToMany(() => Ticket, (ticket) => ticket.empresa)
  tickets: Ticket[];

  @OneToOne(() => User, { nullable: true })
  @JoinColumn()
  admin: User;

  @OneToMany(() => User, (user) => user.empresa)
  users: User[];

}
