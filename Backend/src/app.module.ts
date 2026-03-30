import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { Expense } from './expenses/expense.entity';
import { ExpensesModule } from './expenses/expenses.module';
import { TicketsModule } from './tickets/tickets.module';
import { AdvisorModule } from './advisor/advisor.module';
import { AdvisorRecommendation } from './advisor/advisor-recommendation.entity';
import { Budget } from './budgets/budget.entity';
import { BudgetsModule } from './budgets/budgets.module';
import { BadgeDefinition } from './gamification/badge-definition.entity';
import { UserBadge } from './gamification/user-badge.entity';
import { GamificationModule } from './gamification/gamification.module';
import { Friendship } from './friendships/friendship.entity';
import { FriendshipsModule } from './friendships/friendships.module';
import { SharedExpense } from './shared-expenses/shared-expense.entity';
import { SharedExpenseParticipant } from './shared-expenses/shared-expense-participant.entity';
import { SharedExpensesModule } from './shared-expenses/shared-expenses.module';

const ALL_ENTITIES = [
  User,
  Expense,
  AdvisorRecommendation,
  Budget,
  BadgeDefinition,
  UserBadge,
  Friendship,
  SharedExpense,
  SharedExpenseParticipant,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;

        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            entities: ALL_ENTITIES,
            synchronize: true,
          };
        }

        return {
          type: 'sqlite' as const,
          database: 'database.sqlite',
          entities: ALL_ENTITIES,
          synchronize: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    ExpensesModule,
    TicketsModule,
    AdvisorModule,
    BudgetsModule,
    GamificationModule,
    FriendshipsModule,
    SharedExpensesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
