import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../common/roles/role.enum';
import { Expense } from '../expenses/expense.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  passwordHash: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationTokenHash: string | null;

  @Column({
    type: process.env.DATABASE_URL ? 'timestamptz' : 'datetime',
    nullable: true,
  })
  emailVerificationExpiresAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  passwordResetTokenHash: string | null;

  @Column({
    type: process.env.DATABASE_URL ? 'timestamptz' : 'datetime',
    nullable: true,
  })
  passwordResetExpiresAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  authProvider: string | null;

  @Column({ type: 'text', default: Role.USER })
  role: Role;

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
