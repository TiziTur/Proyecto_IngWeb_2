import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('advisor_recommendations')
export class AdvisorRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  advisorUserId: string;

  @Column({ type: 'text' })
  targetUserId: string;

  @Column({ type: 'text', default: 'local' })
  provider: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @CreateDateColumn()
  createdAt: Date;
}
