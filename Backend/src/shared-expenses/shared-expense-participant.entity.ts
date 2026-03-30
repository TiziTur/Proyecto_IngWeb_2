import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { SharedExpense } from './shared-expense.entity';

@Entity('shared_expense_participants')
export class SharedExpenseParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SharedExpense, (se) => se.participants, {
    onDelete: 'CASCADE',
    eager: false,
  })
  sharedExpense: SharedExpense;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  /** This participant's share of the total */
  @Column({ type: 'float' })
  shareAmount: number;

  /** True when this participant has settled their debt */
  @Column({ type: 'boolean', default: false })
  settled: boolean;

  @Column({ type: 'timestamp', nullable: true, default: null })
  settledAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
