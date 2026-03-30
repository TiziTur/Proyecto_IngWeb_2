import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { BadgeDefinition } from './badge-definition.entity';

@Entity('user_badges')
@Unique(['user', 'badge'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  user: User;

  @ManyToOne(() => BadgeDefinition, { eager: true, onDelete: 'CASCADE' })
  badge: BadgeDefinition;

  @CreateDateColumn()
  earnedAt: Date;

  /** Optional extra context stored as JSON string */
  @Column({ type: 'text', nullable: true, default: null })
  meta: string | null;
}
