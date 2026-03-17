import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
  ) {}

  async create(userId: string, dto: CreateExpenseDto): Promise<Expense> {
    const commerce = dto.commerce || dto.concept || dto.description || 'Sin concepto';
    const expense = this.expensesRepository.create({
      commerce,
      date: dto.date,
      amount: dto.amount,
      category: dto.category,
      description: dto.description ?? '',
      currency: dto.currency,
      participants: dto.participants ?? 1,
      user: { id: userId } as Expense['user'],
    });

    return this.expensesRepository.save(expense);
  }

  async findAllForUser(userId: string): Promise<Expense[]> {
    return this.expensesRepository.find({
      where: { user: { id: userId } },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findAllUsersExpenses(): Promise<Expense[]> {
    return this.expensesRepository.find({
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async update(id: string, userId: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado.');
    }

    const patch: Partial<Expense> = { ...dto };
    if (dto.concept && !dto.commerce) {
      patch.commerce = dto.concept;
    }

    Object.assign(expense, patch);
    return this.expensesRepository.save(expense);
  }

  async remove(id: string, userId: string): Promise<{ deleted: true }> {
    const expense = await this.expensesRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado.');
    }

    await this.expensesRepository.remove(expense);
    return { deleted: true };
  }
}
