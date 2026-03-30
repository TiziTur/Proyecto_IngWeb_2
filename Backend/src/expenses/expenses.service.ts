import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @Inject(forwardRef(() => GamificationService))
    private readonly gamification: GamificationService,
  ) {}

  async findFiltered(params: {
    userId?: string;
    q?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<Expense[] | { data: Expense[]; meta: { total: number; page: number; limit: number; pages: number } }> {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 0)));
    const hasPagination = limit > 0;

    const where: FindOptionsWhere<Expense> = {};
    if (params.userId) {
      where.user = { id: params.userId } as Expense['user'];
    }
    if (params.category) {
      where.category = params.category;
    }

    if (params.dateFrom && params.dateTo) {
      where.date = Between(params.dateFrom, params.dateTo);
    } else if (params.dateFrom) {
      where.date = Between(params.dateFrom, '9999-12-31');
    } else if (params.dateTo) {
      where.date = Between('1900-01-01', params.dateTo);
    }

    const q = params.q?.trim();
    const whereWithQ = q
      ? [
          { ...where, commerce: ILike(`%${q}%`) },
          { ...where, description: ILike(`%${q}%`) },
        ]
      : where;

    if (!hasPagination) {
      return this.expensesRepository.find({
        where: whereWithQ,
        order: { date: 'DESC', createdAt: 'DESC' },
      });
    }

    const [data, total] = await this.expensesRepository.findAndCount({
      where: whereWithQ,
      order: { date: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async create(userId: string, dto: CreateExpenseDto, context?: { ocrUsed?: boolean }): Promise<Expense> {
    const commerce = dto.commerce || dto.concept || dto.description || 'Sin concepto';
    const expense = this.expensesRepository.create({
      commerce,
      date: dto.date,
      amount: dto.amount,
      category: dto.category,
      description: dto.description ?? dto.concept ?? '',
      currency: dto.currency,
      participants: dto.participants ?? 1,
      isMonthly: dto.isMonthly ?? false,
      user: { id: userId } as Expense['user'],
    });

    const saved = await this.expensesRepository.save(expense);

    // Fire-and-forget badge evaluation
    void this.gamification.evaluate(userId, { ocrUsed: context?.ocrUsed });

    return saved;
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
      if (!dto.description) {
        patch.description = dto.concept;
      }
    }

    Object.assign(expense, patch);
    const saved = await this.expensesRepository.save(expense);

    // Re-evaluate after update (isMonthly may have changed, etc.)
    void this.gamification.evaluate(userId);

    return saved;
  }

  async remove(id: string, userId: string): Promise<{ deleted: true }> {
    const expense = await this.expensesRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado.');
    }

    await this.expensesRepository.remove(expense);

    // Re-evaluate after deletion (count-based badges may need to be re-checked but
    // we don't revoke earned badges — the evaluate() is idempotent)
    void this.gamification.evaluate(userId);

    return { deleted: true };
  }
}
