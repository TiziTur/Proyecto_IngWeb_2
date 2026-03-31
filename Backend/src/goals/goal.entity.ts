import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human-readable name, e.g. "Vacaciones en Japón" */
  @Column({ type: 'text' })
  name: string;

  /** Target amount to save */
  @Column({ type: 'float' })
  targetAmount: number;

  /** Amount already saved/contributed */
  @Column({ type: 'float', default: 0 })
  savedAmount: number;

  /** Currency of both amounts */
  @Column({ type: 'text', default: 'EUR' })
  currency: string;

  /** Optional deadline */
  @Column({ type: 'date', nullable: true })
  deadline: string | null;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
