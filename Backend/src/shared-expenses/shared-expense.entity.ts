import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { SharedExpenseParticipant } from './shared-expense-participant.entity';

@Entity('shared_expenses')
export class SharedExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'float' })
  totalAmount: number;

  @Column({ type: 'text', default: 'EUR' })
  currency: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text', nullable: true, default: null })
  category: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  description: string | null;

  /** User who physically paid the bill */
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  paidBy: User;

  /** User who registered the shared expense (may differ from payer) */
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  createdBy: User;

  @OneToMany(() => SharedExpenseParticipant, (p) => p.sharedExpense, {
    cascade: true,
    eager: true,
  })
  participants: SharedExpenseParticipant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
