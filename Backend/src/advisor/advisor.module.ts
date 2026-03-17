import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvisorController } from './advisor.controller';
import { AdvisorService } from './advisor.service';
import { ExpensesModule } from '../expenses/expenses.module';
import { AdvisorRecommendation } from './advisor-recommendation.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ExpensesModule, UsersModule, TypeOrmModule.forFeature([AdvisorRecommendation])],
  controllers: [AdvisorController],
  providers: [AdvisorService],
})
export class AdvisorModule {}
