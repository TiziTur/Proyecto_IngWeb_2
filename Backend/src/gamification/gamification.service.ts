import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadgeDefinition, ConditionType } from './badge-definition.entity';
import { UserBadge } from './user-badge.entity';
import { Expense } from '../expenses/expense.entity';
import { Budget } from '../budgets/budget.entity';

// ── Seed data ─────────────────────────────────────────────────────────────────
const BADGE_SEED: Omit<BadgeDefinition, never>[] = [
  {
    id: 'first-expense',
    nameEs: 'Primer paso',
    nameEn: 'First Step',
    descriptionEs: 'Registraste tu primer gasto.',
    descriptionEn: 'You registered your first expense.',
    icon: 'bi-star-fill',
    color: '#f59e0b',
    conditionType: 'expense_count',
    conditionValue: 1,
    conditionValue2: null,
  },
  {
    id: 'expense-10',
    nameEs: 'Coleccionista',
    nameEn: 'Collector',
    descriptionEs: 'Tienes 10 gastos registrados.',
    descriptionEn: 'You have 10 expenses registered.',
    icon: 'bi-collection-fill',
    color: '#3b82f6',
    conditionType: 'expense_count',
    conditionValue: 10,
    conditionValue2: null,
  },
  {
    id: 'expense-50',
    nameEs: 'Experto financiero',
    nameEn: 'Finance Expert',
    descriptionEs: 'Tienes 50 gastos registrados.',
    descriptionEn: 'You have 50 expenses registered.',
    icon: 'bi-trophy-fill',
    color: '#7c3aed',
    conditionType: 'expense_count',
    conditionValue: 50,
    conditionValue2: null,
  },
  {
    id: 'expense-100',
    nameEs: 'Maestro del control',
    nameEn: 'Control Master',
    descriptionEs: 'Tienes 100 gastos registrados.',
    descriptionEn: 'You have 100 expenses registered.',
    icon: 'bi-gem',
    color: '#ec4899',
    conditionType: 'expense_count',
    conditionValue: 100,
    conditionValue2: null,
  },
  {
    id: 'first-recurring',
    nameEs: 'Compromisos claros',
    nameEn: 'Clear Commitments',
    descriptionEs: 'Configuraste tu primer gasto recurrente.',
    descriptionEn: 'You set up your first recurring expense.',
    icon: 'bi-arrow-repeat',
    color: '#06b6d4',
    conditionType: 'recurring_set',
    conditionValue: 1,
    conditionValue2: null,
  },
  {
    id: 'category-master',
    nameEs: 'Multifacético',
    nameEn: 'Multifaceted',
    descriptionEs: 'Gastos en 5 categorías distintas.',
    descriptionEn: 'Expenses across 5 different categories.',
    icon: 'bi-grid-3x3-gap-fill',
    color: '#10b981',
    conditionType: 'category_diversity',
    conditionValue: 5,
    conditionValue2: null,
  },
  {
    id: 'budget-month-1',
    nameEs: 'Mes bajo control',
    nameEn: 'Month Under Control',
    descriptionEs: 'Cerraste 1 mes por debajo de tu presupuesto total.',
    descriptionEn: 'Finished 1 month under your total budget.',
    icon: 'bi-piggy-bank-fill',
    color: '#f59e0b',
    conditionType: 'monthly_budget',
    conditionValue: 1,
    conditionValue2: null,
  },
  {
    id: 'budget-month-3',
    nameEs: 'Racha de ahorro',
    nameEn: 'Savings Streak',
    descriptionEs: '3 meses consecutivos bajo tu presupuesto total.',
    descriptionEn: '3 consecutive months under your total budget.',
    icon: 'bi-award-fill',
    color: '#3b82f6',
    conditionType: 'streak_months',
    conditionValue: 3,
    conditionValue2: null,
  },
  {
    id: 'budget-month-6',
    nameEs: 'Disciplina de acero',
    nameEn: 'Iron Discipline',
    descriptionEs: '6 meses consecutivos bajo tu presupuesto total.',
    descriptionEn: '6 consecutive months under your total budget.',
    icon: 'bi-shield-fill-check',
    color: '#7c3aed',
    conditionType: 'streak_months',
    conditionValue: 6,
    conditionValue2: null,
  },
  {
    id: 'shared-first',
    nameEs: 'En buena compañía',
    nameEn: 'Good Company',
    descriptionEs: 'Creaste tu primer gasto compartido.',
    descriptionEn: 'You created your first shared expense.',
    icon: 'bi-people-fill',
    color: '#10b981',
    conditionType: 'shared_expense',
    conditionValue: 1,
    conditionValue2: null,
  },
  {
    id: 'night-owl',
    nameEs: 'Búho nocturno',
    nameEn: 'Night Owl',
    descriptionEs: 'Registraste un gasto entre las 00:00 y las 05:00.',
    descriptionEn: 'Registered an expense between midnight and 5am.',
    icon: 'bi-moon-stars-fill',
    color: '#6366f1',
    conditionType: 'time_of_day',
    conditionValue: 0,   // hour start (inclusive)
    conditionValue2: 5,  // hour end (exclusive)
  },
  {
    id: 'early-bird',
    nameEs: 'Madrugador',
    nameEn: 'Early Bird',
    descriptionEs: 'Registraste un gasto antes de las 07:00.',
    descriptionEn: 'Registered an expense before 7am.',
    icon: 'bi-sunrise-fill',
    color: '#f97316',
    conditionType: 'time_of_day',
    conditionValue: 5,   // hour start (inclusive)
    conditionValue2: 7,  // hour end (exclusive)
  },
];

// ── Service ───────────────────────────────────────────────────────────────────
@Injectable()
export class GamificationService implements OnModuleInit {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(BadgeDefinition)
    private readonly badgeRepo: Repository<BadgeDefinition>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
  ) {}

  // ── Seed badges on startup ─────────────────────────────────────────────────
  async onModuleInit() {
    for (const badge of BADGE_SEED) {
      const exists = await this.badgeRepo.findOne({ where: { id: badge.id } });
      if (!exists) {
        await this.badgeRepo.save(this.badgeRepo.create(badge));
      } else {
        // Update mutable fields in case descriptions changed
        await this.badgeRepo.save({ ...exists, ...badge });
      }
    }
    this.logger.log(`Gamification: ${BADGE_SEED.length} badge definitions synced.`);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Returns all badge definitions with earnedAt if the user has them. */
  async getBadgesForUser(userId: string): Promise<{
    badges: Array<BadgeDefinition & { earned: boolean; earnedAt: Date | null; progress: number | null }>;
    totalEarned: number;
  }> {
    const [allBadges, userBadges] = await Promise.all([
      this.badgeRepo.find({ order: { conditionValue: 'ASC' } }),
      this.userBadgeRepo.find({
        where: { user: { id: userId } },
        relations: ['badge'],
      }),
    ]);

    const earnedMap = new Map<string, Date>(
      userBadges.map((ub) => [ub.badge.id, ub.earnedAt]),
    );

    // Compute progress for unearned badges
    const expenses = await this.expenseRepo.find({
      where: { user: { id: userId } },
      order: { date: 'DESC' },
    });

    const badges = allBadges.map((b) => {
      const earned = earnedMap.has(b.id);
      const earnedAt = earnedMap.get(b.id) ?? null;
      const progress = earned ? null : this.computeProgress(b, expenses);
      return { ...b, earned, earnedAt, progress };
    });

    return { badges, totalEarned: earnedMap.size };
  }

  /**
   * Evaluate all badges for a user and award any newly satisfied ones.
   * Called after create/update/remove expense and after shared expense creation.
   * Fire-and-forget safe — errors are swallowed after logging.
   */
  async evaluate(userId: string, context?: { ocrUsed?: boolean; sharedExpenseCreated?: boolean }): Promise<void> {
    try {
      const [allBadges, userBadges, expenses, budgets] = await Promise.all([
        this.badgeRepo.find(),
        this.userBadgeRepo.find({
          where: { user: { id: userId } },
          relations: ['badge'],
        }),
        this.expenseRepo.find({
          where: { user: { id: userId } },
          order: { date: 'ASC', createdAt: 'ASC' },
        }),
        this.budgetRepo.find({ where: { user: { id: userId } } }),
      ]);

      const alreadyEarned = new Set(userBadges.map((ub) => ub.badge.id));

      for (const badge of allBadges) {
        if (alreadyEarned.has(badge.id)) continue;
        const satisfied = this.isSatisfied(badge, expenses, budgets, context);
        if (satisfied) {
          const ub = this.userBadgeRepo.create({
            user: { id: userId } as UserBadge['user'],
            badge,
          });
          await this.userBadgeRepo.save(ub);
          this.logger.log(`Badge awarded: ${badge.id} → user ${userId}`);
        }
      }
    } catch (err) {
      this.logger.error(`Gamification evaluate error for user ${userId}: ${(err as Error).message}`);
    }
  }

  // ── Condition evaluation ───────────────────────────────────────────────────

  private isSatisfied(
    badge: BadgeDefinition,
    expenses: Expense[],
    budgets: Budget[],
    ctx?: { ocrUsed?: boolean; sharedExpenseCreated?: boolean },
  ): boolean {
    switch (badge.conditionType as ConditionType) {
      case 'expense_count':
        return expenses.length >= badge.conditionValue;

      case 'recurring_set':
        return expenses.filter((e) => e.isMonthly).length >= badge.conditionValue;

      case 'category_diversity': {
        const cats = new Set(expenses.map((e) => e.category).filter(Boolean));
        return cats.size >= badge.conditionValue;
      }

      case 'monthly_budget':
        return this.monthsUnderBudget(expenses, budgets) >= badge.conditionValue;

      case 'streak_months':
        return this.consecutiveMonthsUnderBudget(expenses, budgets) >= badge.conditionValue;

      case 'ocr_use':
        return ctx?.ocrUsed === true;

      case 'shared_expense':
        return ctx?.sharedExpenseCreated === true;

      case 'time_of_day': {
        const start = badge.conditionValue;
        const end = badge.conditionValue2 ?? 24;
        return expenses.some((e) => {
          const h = new Date(e.createdAt).getHours();
          return h >= start && h < end;
        });
      }

      default:
        return false;
    }
  }

  private computeProgress(badge: BadgeDefinition, expenses: Expense[]): number | null {
    switch (badge.conditionType as ConditionType) {
      case 'expense_count':
        return Math.min(1, expenses.length / badge.conditionValue);
      case 'recurring_set':
        return Math.min(1, expenses.filter((e) => e.isMonthly).length / badge.conditionValue);
      case 'category_diversity': {
        const cats = new Set(expenses.map((e) => e.category));
        return Math.min(1, cats.size / badge.conditionValue);
      }
      default:
        return null;
    }
  }

  // ── Budget helpers ─────────────────────────────────────────────────────────

  /** Count how many months (any, not necessarily consecutive) total spend was below the 'total' budget limit. */
  private monthsUnderBudget(expenses: Expense[], budgets: Budget[]): number {
    const totalBudget = budgets.find((b) => b.category === 'total');
    if (!totalBudget) return 0;

    const byMonth = this.groupExpensesByMonth(expenses);
    let count = 0;
    for (const monthlyTotal of Object.values(byMonth)) {
      if (monthlyTotal <= totalBudget.limitAmount) count++;
    }
    return count;
  }

  /** Count max consecutive months under budget (ending at the latest complete month). */
  private consecutiveMonthsUnderBudget(expenses: Expense[], budgets: Budget[]): number {
    const totalBudget = budgets.find((b) => b.category === 'total');
    if (!totalBudget) return 0;

    const byMonth = this.groupExpensesByMonth(expenses);
    const sortedKeys = Object.keys(byMonth).sort(); // 'YYYY-MM'

    let maxStreak = 0;
    let current = 0;
    for (const key of sortedKeys) {
      if (byMonth[key] <= totalBudget.limitAmount) {
        current++;
        maxStreak = Math.max(maxStreak, current);
      } else {
        current = 0;
      }
    }
    return maxStreak;
  }

  private groupExpensesByMonth(expenses: Expense[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      const d = new Date(e.date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] ?? 0) + (e.amount ?? 0);
    }
    return map;
  }
}
