import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly repo: Repository<Goal>,
  ) {}

  findAll(userId: string): Promise<Goal[]> {
    return this.repo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
  }

  async create(userId: string, dto: CreateGoalDto): Promise<Goal> {
    const goal = this.repo.create({
      ...dto,
      currency: dto.currency || 'EUR',
      savedAmount: dto.savedAmount ?? 0,
      user: { id: userId } as any,
    });
    return this.repo.save(goal);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.repo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    Object.assign(goal, dto);
    return this.repo.save(goal);
  }

  async remove(userId: string, id: string): Promise<{ deleted: boolean }> {
    const goal = await this.repo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    await this.repo.remove(goal);
    return { deleted: true };
  }
}
