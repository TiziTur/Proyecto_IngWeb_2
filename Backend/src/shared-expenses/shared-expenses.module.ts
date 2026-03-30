import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedExpense } from './shared-expense.entity';
import { SharedExpenseParticipant } from './shared-expense-participant.entity';
import { SharedExpensesService } from './shared-expenses.service';
import { SharedExpensesController } from './shared-expenses.controller';
import { User } from '../users/user.entity';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SharedExpense, SharedExpenseParticipant, User]),
    GamificationModule,
  ],
  controllers: [SharedExpensesController],
  providers: [SharedExpensesService],
  exports: [SharedExpensesService],
})
export class SharedExpensesModule {}
