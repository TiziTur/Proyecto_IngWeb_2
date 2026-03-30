import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { normalizeEmail } from '../common/utils/normalize-email';

type CounterBucket = {
  count: number;
  firstSeenAt: number;
};

@Injectable()
export class AuthSecurityService {
  private loginAttempts = new Map<string, CounterBucket>();

  generateToken() {
    return randomBytes(32).toString('hex');
  }

  hashToken(raw: string) {
    return createHash('sha256').update(raw).digest('hex');
  }

  normalizeEmail(email: string) {
    return normalizeEmail(email);
  }

  assertLoginRateLimit(email: string) {
    const key = normalizeEmail(email);
    const now = Date.now();
    const maxAttempts = 8;
    const windowMs = 15 * 60 * 1000;

    const existing = this.loginAttempts.get(key);
    if (!existing || now - existing.firstSeenAt > windowMs) {
      this.loginAttempts.set(key, { count: 1, firstSeenAt: now });
      return;
    }

    existing.count += 1;
    if (existing.count > maxAttempts) {
      throw new HttpException('Demasiados intentos. Intentalo de nuevo en unos minutos.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  clearLoginRateLimit(email: string) {
    const key = normalizeEmail(email);
    this.loginAttempts.delete(key);
  }
}
