import { Column, Entity, PrimaryColumn } from 'typeorm';

export type ConditionType =
  | 'expense_count'
  | 'monthly_budget'
  | 'streak_months'
  | 'ocr_use'
  | 'category_diversity'
  | 'recurring_set'
  | 'shared_expense'
  | 'time_of_day';

@Entity('badge_definitions')
export class BadgeDefinition {
  @PrimaryColumn({ type: 'text' })
  id: string; // slug, e.g. 'first-expense'

  @Column({ type: 'text' })
  nameEs: string;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text' })
  descriptionEs: string;

  @Column({ type: 'text' })
  descriptionEn: string;

  /** Bootstrap Icons class, e.g. 'bi-star-fill' */
  @Column({ type: 'text' })
  icon: string;

  /** Hex colour for the badge chip */
  @Column({ type: 'text' })
  color: string;

  @Column({ type: 'text' })
  conditionType: ConditionType;

  /** Numeric threshold: e.g. count=10, months=3, hour=7 */
  @Column({ type: 'float', default: 1 })
  conditionValue: number;

  /** Optional: second threshold (e.g. for time ranges) */
  @Column({ type: 'float', nullable: true, default: null })
  conditionValue2: number | null;
}
