import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship } from './friendship.entity';
import { User } from '../users/user.entity';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Injectable()
export class FriendshipsService {
  constructor(
    @InjectRepository(Friendship)
    private readonly repo: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ── Send request ──────────────────────────────────────────────────────────

  async sendRequest(requesterId: string, dto: SendFriendRequestDto): Promise<Friendship> {
    if (!dto.email) throw new BadRequestException('Email requerido.');

    const addressee = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!addressee) throw new NotFoundException('Usuario no encontrado.');
    if (addressee.id === requesterId) {
      throw new BadRequestException('No puedes enviarte una solicitud a ti mismo.');
    }

    // Check for existing relationship in either direction
    const existing = await this.repo
      .createQueryBuilder('f')
      .where(
        '(f.requesterId = :a AND f.addresseeId = :b) OR (f.requesterId = :b AND f.addresseeId = :a)',
        { a: requesterId, b: addressee.id },
      )
      .getOne();

    if (existing) {
      if (existing.status === 'accepted') {
        throw new BadRequestException('Ya son amigos.');
      }
      if (existing.status === 'pending') {
        throw new BadRequestException('Ya existe una solicitud pendiente.');
      }
      // If rejected, allow resending by updating status back to pending
      existing.status = 'pending';
      existing.requester = { id: requesterId } as User;
      existing.addressee = addressee;
      return this.repo.save(existing);
    }

    const friendship = this.repo.create({
      requester: { id: requesterId } as User,
      addressee,
      status: 'pending',
    });

    return this.repo.save(friendship);
  }

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(userId: string): Promise<{
    friends: Friendship[];
    sentRequests: Friendship[];
    receivedRequests: Friendship[];
  }> {
    const all = await this.repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.requester', 'requester')
      .leftJoinAndSelect('f.addressee', 'addressee')
      .where('f.requesterId = :uid OR f.addresseeId = :uid', { uid: userId })
      .orderBy('f.updatedAt', 'DESC')
      .getMany();

    const friends = all.filter((f) => f.status === 'accepted');
    const sentRequests = all.filter(
      (f) => f.status === 'pending' && f.requester.id === userId,
    );
    const receivedRequests = all.filter(
      (f) => f.status === 'pending' && f.addressee.id === userId,
    );

    return { friends, sentRequests, receivedRequests };
  }

  /** Returns the list of accepted friend User objects for a given user */
  async getFriendUsers(userId: string): Promise<User[]> {
    const accepted = await this.repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.requester', 'requester')
      .leftJoinAndSelect('f.addressee', 'addressee')
      .where(
        '(f.requesterId = :uid OR f.addresseeId = :uid) AND f.status = :status',
        { uid: userId, status: 'accepted' },
      )
      .getMany();

    return accepted.map((f) =>
      f.requester.id === userId ? f.addressee : f.requester,
    );
  }

  // ── Accept / Reject ───────────────────────────────────────────────────────

  async accept(userId: string, friendshipId: string): Promise<Friendship> {
    const f = await this.findOneForAddressee(userId, friendshipId);
    f.status = 'accepted';
    return this.repo.save(f);
  }

  async reject(userId: string, friendshipId: string): Promise<Friendship> {
    const f = await this.findOneForAddressee(userId, friendshipId);
    f.status = 'rejected';
    return this.repo.save(f);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(userId: string, friendshipId: string): Promise<{ deleted: true }> {
    const f = await this.repo
      .createQueryBuilder('f')
      .where('f.id = :fid AND (f.requesterId = :uid OR f.addresseeId = :uid)', {
        fid: friendshipId,
        uid: userId,
      })
      .getOne();

    if (!f) throw new NotFoundException('Relación no encontrada.');

    await this.repo.remove(f);
    return { deleted: true };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findOneForAddressee(userId: string, friendshipId: string): Promise<Friendship> {
    const f = await this.repo.findOne({
      where: { id: friendshipId, addressee: { id: userId }, status: 'pending' },
    });

    if (!f) throw new NotFoundException('Solicitud no encontrada o sin permiso.');

    return f;
  }
}
