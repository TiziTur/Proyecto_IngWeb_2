import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

@Entity('friendships')
export class Friendship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** User who sent the friend request */
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  requester: User;

  /** User who received the friend request */
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  addressee: User;

  @Column({ type: 'text', default: 'pending' })
  status: FriendshipStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
