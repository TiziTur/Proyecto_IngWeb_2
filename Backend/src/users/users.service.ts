import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../common/roles/role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const seeds = [
      { email: 'advisor@klarity.app', name: 'Sofia Asesor', password: 'Klarity2026!', role: Role.ADVISOR },
      { email: 'admin@klarity.app',   name: 'Admin Klarity', password: 'Admin2026!',   role: Role.ADMIN },
      { email: 'demo@klarity.app',    name: 'Demo User',    password: 'Demo2026!',    role: Role.USER },
    ];

    for (const seed of seeds) {
      const existing = await this.findByEmail(seed.email);
      if (!existing) {
        const passwordHash = await bcrypt.hash(seed.password, 10);
        await this.create({ email: seed.email, name: seed.name, passwordHash, role: seed.role });
      }
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: Role;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role ?? Role.USER,
    });

    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, payload: { name?: string; email?: string }): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    if (payload.name) {
      user.name = payload.name;
    }

    if (payload.email) {
      user.email = payload.email;
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

  listAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { name: 'ASC' } });
  }
}
