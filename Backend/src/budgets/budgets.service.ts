import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './budget.entity';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly repo: Repository<Budget>,
  ) {}

  async findAll(userId: string): Promise<Budget[]> {
    return this.repo.find({
      where: { user: { id: userId } },
      order: { category: 'ASC' },
    });
  }

  async upsert(userId: string, dto: UpsertBudgetDto): Promise<Budget> {
    let budget = await this.repo.findOne({
      where: { user: { id: userId }, category: dto.category },
    });

    if (!budget) {
      budget = this.repo.create({
        category: dto.category,
        limitAmount: dto.limitAmount,
        currency: dto.currency ?? 'EUR',
        user: { id: userId } as Budget['user'],
      });
    } else {
      budget.limitAmount = dto.limitAmount;
      if (dto.currency) budget.currency = dto.currency;
    }

    return this.repo.save(budget);
  }

  async remove(userId: string, category: string): Promise<{ deleted: true }> {
    const budget = await this.repo.findOne({
      where: { user: { id: userId }, category },
    });

    if (!budget) throw new NotFoundException('Presupuesto no encontrado.');

    await this.repo.remove(budget);
    return { deleted: true };
  }

  /** Used by GamificationService to check budget compliance */
  async findOne(userId: string, category: string): Promise<Budget | null> {
    return this.repo.findOne({ where: { user: { id: userId }, category } });
  }
}
