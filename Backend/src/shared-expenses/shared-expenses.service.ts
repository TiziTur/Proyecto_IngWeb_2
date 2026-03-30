import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharedExpense } from './shared-expense.entity';
import { SharedExpenseParticipant } from './shared-expense-participant.entity';
import { CreateSharedExpenseDto } from './dto/create-shared-expense.dto';
import { User } from '../users/user.entity';
import { GamificationService } from '../gamification/gamification.service';

export interface DebtEdge {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  currency: string;
}

@Injectable()
export class SharedExpensesService {
  constructor(
    @InjectRepository(SharedExpense)
    private readonly seRepo: Repository<SharedExpense>,
    @InjectRepository(SharedExpenseParticipant)
    private readonly partRepo: Repository<SharedExpenseParticipant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gamification: GamificationService,
  ) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async create(creatorId: string, dto: CreateSharedExpenseDto): Promise<SharedExpense> {
    if (!dto.participants || dto.participants.length === 0) {
      throw new BadRequestException('Debe haber al menos un participante.');
    }

    const paidByUserId = dto.paidByUserId ?? creatorId;

    const se = this.seRepo.create({
      title: dto.title,
      totalAmount: dto.totalAmount,
      currency: dto.currency ?? 'EUR',
      date: dto.date,
      category: dto.category ?? null,
      description: dto.description ?? null,
      paidBy: { id: paidByUserId } as User,
      createdBy: { id: creatorId } as User,
    });

    const savedSe = await this.seRepo.save(se);

    const participantEntities = dto.participants.map((p) => {
      return this.partRepo.create({
        sharedExpense: savedSe,
        user: { id: p.userId } as User,
        shareAmount: p.shareAmount,
        settled: p.userId === paidByUserId, // payer has already "paid"
        settledAt: p.userId === paidByUserId ? new Date() : null,
      });
    });

    await this.partRepo.save(participantEntities);

    // Award shared-expense badge
    void this.gamification.evaluate(creatorId, { sharedExpenseCreated: true });

    return this.findOne(creatorId, savedSe.id);
  }

  // ── Find all for user ─────────────────────────────────────────────────────

  async findAll(userId: string): Promise<SharedExpense[]> {
    // Return all shared expenses where the user is either creator, payer, or participant
    const asCreatorOrPayer = await this.seRepo
      .createQueryBuilder('se')
      .leftJoinAndSelect('se.participants', 'p')
      .leftJoinAndSelect('p.user', 'pu')
      .leftJoinAndSelect('se.paidBy', 'paidBy')
      .leftJoinAndSelect('se.createdBy', 'createdBy')
      .where('se.createdById = :uid OR se.paidById = :uid', { uid: userId })
      .orderBy('se.date', 'DESC')
      .addOrderBy('se.createdAt', 'DESC')
      .getMany();

    const asParticipant = await this.seRepo
      .createQueryBuilder('se')
      .leftJoinAndSelect('se.participants', 'p')
      .leftJoinAndSelect('p.user', 'pu')
      .leftJoinAndSelect('se.paidBy', 'paidBy')
      .leftJoinAndSelect('se.createdBy', 'createdBy')
      .innerJoin('se.participants', 'myPart', 'myPart.userId = :uid', { uid: userId })
      .orderBy('se.date', 'DESC')
      .addOrderBy('se.createdAt', 'DESC')
      .getMany();

    // Merge and deduplicate by id
    const map = new Map<string, SharedExpense>();
    [...asCreatorOrPayer, ...asParticipant].forEach((se) => map.set(se.id, se));

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  // ── Find one ──────────────────────────────────────────────────────────────

  async findOne(userId: string, id: string): Promise<SharedExpense> {
    const se = await this.seRepo
      .createQueryBuilder('se')
      .leftJoinAndSelect('se.participants', 'p')
      .leftJoinAndSelect('p.user', 'pu')
      .leftJoinAndSelect('se.paidBy', 'paidBy')
      .leftJoinAndSelect('se.createdBy', 'createdBy')
      .where('se.id = :id', { id })
      .getOne();

    if (!se) throw new NotFoundException('Gasto compartido no encontrado.');

    // Check that user is involved
    const involved =
      se.createdBy.id === userId ||
      se.paidBy.id === userId ||
      se.participants.some((p) => p.user.id === userId);

    if (!involved) throw new ForbiddenException('Sin acceso a este gasto.');

    return se;
  }

  // ── Settle a participant ───────────────────────────────────────────────────

  async settle(
    requesterId: string,
    sharedExpenseId: string,
    targetUserId: string,
  ): Promise<SharedExpenseParticipant> {
    const se = await this.findOne(requesterId, sharedExpenseId);

    // Only the payer or creator can mark others as settled
    const canSettle =
      se.paidBy.id === requesterId ||
      se.createdBy.id === requesterId ||
      targetUserId === requesterId;

    if (!canSettle) {
      throw new ForbiddenException('Solo el pagador o el creador pueden marcar pagos.');
    }

    const part = se.participants.find((p) => p.user.id === targetUserId);
    if (!part) throw new NotFoundException('Participante no encontrado en este gasto.');

    part.settled = true;
    part.settledAt = new Date();
    return this.partRepo.save(part);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(userId: string, id: string): Promise<{ deleted: true }> {
    const se = await this.findOne(userId, id);

    if (se.createdBy.id !== userId) {
      throw new ForbiddenException('Solo el creador puede eliminar este gasto.');
    }

    await this.seRepo.remove(se);
    return { deleted: true };
  }

  // ── Balance / debt simplification ─────────────────────────────────────────

  async getBalance(userId: string): Promise<{
    iOwe: DebtEdge[];
    theyOweMe: DebtEdge[];
    simplified: DebtEdge[];
  }> {
    const all = await this.findAll(userId);

    // Net balance map: key = `fromId:toId`, value = amount (positive = from owes to)
    const netMap = new Map<string, { from: User; to: User; amount: number; currency: string }>();

    for (const se of all) {
      const payer = se.paidBy;
      const currency = se.currency;

      for (const part of se.participants) {
        if (part.settled) continue;
        if (part.user.id === payer.id) continue; // payer doesn't owe themselves

        const debtor = part.user;
        const amount = part.shareAmount;

        // debtor owes payer `amount`
        const keyFwd = `${debtor.id}:${payer.id}:${currency}`;
        const keyRev = `${payer.id}:${debtor.id}:${currency}`;

        if (netMap.has(keyRev)) {
          // There's an opposite debt — net them out
          const rev = netMap.get(keyRev)!;
          if (rev.amount > amount) {
            rev.amount -= amount;
          } else {
            netMap.delete(keyRev);
            const remainder = amount - rev.amount;
            if (remainder > 0.001) {
              netMap.set(keyFwd, { from: debtor, to: payer, amount: remainder, currency });
            }
          }
        } else {
          const existing = netMap.get(keyFwd);
          if (existing) {
            existing.amount += amount;
          } else {
            netMap.set(keyFwd, { from: debtor, to: payer, amount, currency });
          }
        }
      }
    }

    const edges: DebtEdge[] = Array.from(netMap.values()).map((e) => ({
      fromUserId: e.from.id,
      fromUserName: e.from.name || e.from.email,
      toUserId: e.to.id,
      toUserName: e.to.name || e.to.email,
      amount: Math.round(e.amount * 100) / 100,
      currency: e.currency,
    }));

    const iOwe = edges.filter((e) => e.fromUserId === userId);
    const theyOweMe = edges.filter((e) => e.toUserId === userId);

    return { iOwe, theyOweMe, simplified: edges };
  }
}
