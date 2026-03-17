import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpensesService } from '../expenses/expenses.service';
import { UsersService } from '../users/users.service';
import { AdvisorRecommendation } from './advisor-recommendation.entity';
import { AdvisorAskDto } from './dto/advisor-ask.dto';

@Injectable()
export class AdvisorService {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly usersService: UsersService,
    @InjectRepository(AdvisorRecommendation)
    private readonly recRepository: Repository<AdvisorRecommendation>,
  ) {}

  async getGlobalOverview() {
    const expenses = await this.expensesService.findAllUsersExpenses();

    const impactedAmount = expenses.reduce((acc, item) => {
      const participants = Math.max(1, item.participants || 1);
      return acc + item.amount / participants;
    }, 0);

    const users = new Set(expenses.map((expense) => expense.user?.id).filter(Boolean));

    const totalAmount = Number(
      expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toFixed(2),
    );

    return {
      totalExpenses: expenses.length,
      totalAmount,
      impactedAmountRaw: Number(impactedAmount.toFixed(2)),
      usersWithExpenses: users.size,
    };
  }

  async getUserOverview(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const expenses = await this.expensesService.findAllForUser(userId);
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
      const key = e.category || 'Otro';
      acc[key] = (acc[key] || 0) + Number(e.amount || 0);
      return acc;
    }, {});

    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      totalExpenses: expenses.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      topCategory,
      byCategory: Object.fromEntries(
        Object.entries(byCategory).map(([k, v]) => [k, Number(v.toFixed(2))]),
      ),
      recentExpenses: expenses.slice(0, 8).map((e) => ({
        id: e.id,
        commerce: e.commerce,
        amount: e.amount,
        category: e.category,
        date: e.date,
      })),
    };
  }

  async getUserPatterns(userId: string) {
    const expenses = (await this.expensesService.findAllUsersExpenses()).filter(
      (expense) => expense.user?.id === userId,
    );

    const byCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
      const participants = Math.max(1, expense.participants || 1);
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount / participants;
      return acc;
    }, {});

    const orderedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const monthlyAverage = this.getMonthlyAverage(expenses);
    const unusualExpenses = this.detectUnusual(expenses);
    const timeline = this.getTimeline(expenses);

    return {
      userId,
      totalExpenses: expenses.length,
      monthlyAverage,
      timeline,
      topCategories: orderedCategories.slice(0, 5).map(([category, value]) => ({
        category,
        amount: Number(value.toFixed(2)),
      })),
      unusualExpenses,
      recommendations: this.generateRecommendations(orderedCategories, monthlyAverage),
    };
  }

  async askAdvisor(advisorUserId: string, dto: AdvisorAskDto) {
    const targetUserId = String(dto.userId);
    const overview = await this.getUserOverview(targetUserId);
    const patterns = await this.getUserPatterns(targetUserId);

    const topCategory = overview.topCategory;
    const total = Number(overview.totalAmount || 0);
    const monthlyAverage = Number(patterns.monthlyAverage || 0);
    const spikes = Array.isArray(patterns.unusualExpenses) ? patterns.unusualExpenses.length : 0;

    const lines: string[] = [];
    lines.push(`Analisis para ${overview.user.name || overview.user.email}:`);
    lines.push(`- Gasto total registrado: $${total.toFixed(2)}.`);
    lines.push(`- Categoria de mayor impacto: ${topCategory}.`);
    lines.push(`- Promedio mensual estimado: $${monthlyAverage.toFixed(2)}.`);
    if (spikes > 0) {
      lines.push(`- Se detectaron ${spikes} gastos inusuales que conviene revisar.`);
    }

    lines.push('Recomendaciones accionables:');
    lines.push(`1) Definir un tope mensual para ${topCategory}.`);
    lines.push('2) Activar una revision semanal de los gastos de mayor monto.');
    lines.push('3) Priorizar reducciones en suscripciones y ocio si se supera el promedio mensual.');

    const answer = lines.join('\n');

    const created = this.recRepository.create({
      advisorUserId,
      targetUserId,
      provider: dto.provider || 'local',
      question: dto.question,
      answer,
    });
    await this.recRepository.save(created);

    return {
      id: created.id,
      answer,
      saved: true,
      createdAt: created.createdAt,
    };
  }

  async getRecommendationHistory(targetUserId: string) {
    const list = await this.recRepository.find({
      where: { targetUserId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return list.map((item) => ({
      id: item.id,
      provider: item.provider,
      question: item.question,
      answer: item.answer,
      createdAt: item.createdAt,
    }));
  }

  async getClientsHealth() {
    const usersResult = await this.usersService.listAll();
    const users = Array.isArray(usersResult) ? usersResult : usersResult.data;
    const clients = users.filter((u) => String(u.role).toLowerCase() === 'user');

    const result = await Promise.all(
      clients.map(async (client) => {
        const expenses = await this.expensesService.findAllForUser(client.id);
        const now = new Date();
        const monthTotal = expenses
          .filter((e) => {
            const d = new Date(e.date || e.createdAt);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const status = monthTotal > 1800 ? 'red' : monthTotal > 900 ? 'yellow' : 'green';

        return {
          userId: client.id,
          name: client.name,
          monthlySpent: Number(monthTotal.toFixed(2)),
          status,
        };
      }),
    );

    return result;
  }

  private getMonthlyAverage(expenses: Array<{ date: string; amount: number; participants: number }>) {
    if (!expenses.length) {
      return 0;
    }

    const monthMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const monthKey = expense.date.slice(0, 7);
      const participants = Math.max(1, expense.participants || 1);
      const current = monthMap.get(monthKey) || 0;
      monthMap.set(monthKey, current + expense.amount / participants);
    });

    const values = [...monthMap.values()];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Number(avg.toFixed(2));
  }

  private detectUnusual(expenses: Array<{ commerce: string; amount: number; date: string }>) {
    if (expenses.length < 5) {
      return [];
    }

    const amounts = expenses.map((e) => e.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    return expenses
      .filter((e) => e.amount >= avg * 2.5)
      .slice(0, 5)
      .map((e) => ({
        commerce: e.commerce,
        amount: e.amount,
        date: e.date,
      }));
  }

  private getTimeline(expenses: Array<{ date: string; amount: number; participants: number }>) {
    const monthMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const monthKey = expense.date.slice(0, 7);
      const participants = Math.max(1, expense.participants || 1);
      const current = monthMap.get(monthKey) || 0;
      monthMap.set(monthKey, current + expense.amount / participants);
    });

    return [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }));
  }

  private generateRecommendations(categories: Array<[string, number]>, monthlyAverage: number): string[] {
    const recommendations: string[] = [];

    if (categories.length > 0) {
      recommendations.push(`Revisar gastos en ${categories[0][0]}, la categoria de mayor impacto.`);
    }

    if (monthlyAverage > 250000) {
      recommendations.push('Activar alertas de gasto alto y definir topes por categoria.');
    }

    if (!recommendations.length) {
      recommendations.push('Mantener el ritmo actual y continuar monitoreando gastos semanales.');
    }

    return recommendations;
  }
}
