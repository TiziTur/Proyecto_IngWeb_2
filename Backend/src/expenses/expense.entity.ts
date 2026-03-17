import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  commerce: string;

  @Column({ type: 'text' })
  category: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'text', default: 'ARS' })
  currency: 'ARS' | 'USD' | 'EUR' | 'GBP' | 'MXN';

  @Column({ type: 'int', default: 1 })
  participants: number;

  @ManyToOne(() => User, (user) => user.expenses, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
