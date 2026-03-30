import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgeDefinition } from './badge-definition.entity';
import { UserBadge } from './user-badge.entity';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { Expense } from '../expenses/expense.entity';
import { Budget } from '../budgets/budget.entity';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BadgeDefinition, UserBadge, Expense, Budget]),
    forwardRef(() => ExpensesModule),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
