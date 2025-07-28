import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'creatorId' }) // 
  createdBy: User;

  @Column()
  creatorId: number;

  @Column({ nullable: true })
  assignedToId: number;

  @ManyToOne(() => User, (user) => user.ticketsAsignados, { eager: false })
  usuarioSolicitante: User;

}
