import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { Expense } from './expenses/expense.entity';
import { ExpensesModule } from './expenses/expenses.module';
import { TicketsModule } from './tickets/tickets.module';
import { AdvisorModule } from './advisor/advisor.module';
import { AdvisorRecommendation } from './advisor/advisor-recommendation.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;

        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            entities: [User, Expense, AdvisorRecommendation],
            synchronize: true,
          };
        }

        return {
          type: 'sqlite' as const,
          database: 'database.sqlite',
          entities: [User, Expense, AdvisorRecommendation],
          synchronize: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    ExpensesModule,
    TicketsModule,
    AdvisorModule,
  ],
})
export class AppModule {}
