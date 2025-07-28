import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';

@Entity()
export class TicketHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  field: string;

  @Column()
  oldValue: string;

  @Column()
  newValue: string;

  @CreateDateColumn()
  changedAt: Date;

  @ManyToOne(() => User, { eager: true })
  changedBy: User;


}
