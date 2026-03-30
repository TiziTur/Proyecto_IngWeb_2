import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../common/roles/role.enum';
import { normalizeEmail } from '../common/utils/normalize-email';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async listAll(params?: {
    q?: string;
    role?: Role;
    page?: number;
    limit?: number;
  }): Promise<User[] | { data: User[]; meta: { total: number; page: number; limit: number; pages: number } }> {
    const q = params?.q?.trim();
    const role = params?.role;
    const page = Math.max(1, Number(params?.page || 1));
    const rawLimit = params?.limit !== undefined ? Number(params.limit) : 0;
    const hasPagination = rawLimit > 0;
    const limit = hasPagination ? Math.min(100, Math.max(1, rawLimit)) : 0;

    const where: FindOptionsWhere<User>[] = [];
    if (q) {
      if (role) {
        where.push({ name: ILike(`%${q}%`), role });
        where.push({ email: ILike(`%${q}%`), role });
      } else {
        where.push({ name: ILike(`%${q}%`) });
        where.push({ email: ILike(`%${q}%`) });
      }
    }

    if (!q && role) {
      where.push({ role });
    }

    if (!hasPagination) {
      return this.usersRepository.find({
        where: where.length ? where : undefined,
        order: { name: 'ASC' },
      });
    }

    const [data, total] = await this.usersRepository.findAndCount({
      where: where.length ? where : undefined,
      order: { name: 'ASC' },
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

  async onModuleInit() {
    const seedDefaultPassword = process.env.SEED_DEFAULT_PASSWORD || randomBytes(12).toString('hex');
    const seeds = [
      { email: 'advisor@klarity.app', name: 'Sofia Asesor', password: process.env.SEED_ADVISOR_PASSWORD || seedDefaultPassword, role: Role.ADVISOR },
      { email: 'admin@klarity.app',   name: 'Admin Klarity', password: process.env.SEED_ADMIN_PASSWORD || seedDefaultPassword, role: Role.ADMIN },
      { email: 'demo@klarity.app',    name: 'Demo User',    password: process.env.SEED_DEMO_PASSWORD || seedDefaultPassword, role: Role.USER },
    ];

    for (const seed of seeds) {
      const existing = await this.findByEmail(seed.email);
      if (!existing) {
        const passwordHash = await bcrypt.hash(seed.password, 10);
        await this.create({
          email: seed.email,
          name: seed.name,
          passwordHash,
          role: seed.role,
          emailVerified: true,
          authProvider: 'password',
        });
      } else if (!existing.emailVerified) {
        existing.emailVerified = true;
        await this.save(existing);
      }
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: normalizeEmail(email) } });
  }

  findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { emailVerificationTokenHash: tokenHash } });
  }

  findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { passwordResetTokenHash: tokenHash } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: Role;
    emailVerified?: boolean;
    emailVerificationTokenHash?: string | null;
    emailVerificationExpiresAt?: Date | null;
    passwordResetTokenHash?: string | null;
    passwordResetExpiresAt?: Date | null;
    authProvider?: string | null;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: normalizeEmail(data.email),
      name: String(data.name || '').trim(),
      passwordHash: data.passwordHash,
      role: data.role ?? Role.USER,
      emailVerified: Boolean(data.emailVerified),
      emailVerificationTokenHash: data.emailVerificationTokenHash ?? null,
      emailVerificationExpiresAt: data.emailVerificationExpiresAt ?? null,
      passwordResetTokenHash: data.passwordResetTokenHash ?? null,
      passwordResetExpiresAt: data.passwordResetExpiresAt ?? null,
      authProvider: data.authProvider ?? 'password',
    });

    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, payload: { name?: string; email?: string }): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    if (payload.name) {
      user.name = String(payload.name).trim();
    }

    if (payload.email) {
      user.email = normalizeEmail(payload.email);
    }

    return this.usersRepository.save(user);
  }

  async updateRole(id: string, role: Role): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    user.role = role;
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<{ deleted: true } | null> {
    const user = await this.findById(id);
    if (!user) return null;
    await this.usersRepository.remove(user);
    return { deleted: true };
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

}
