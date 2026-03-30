import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('budgets')
@Unique(['user', 'category'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 'total' or a category name like 'Alimentación' */
  @Column({ type: 'text' })
  category: string;

  @Column({ type: 'float' })
  limitAmount: number;

  @Column({ type: 'text', default: 'EUR' })
  currency: string;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
