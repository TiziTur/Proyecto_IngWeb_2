import { BadRequestException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/roles/role.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthMailService } from './auth-mail.service';
import { AuthSecurityService } from './auth-security.service';

@Injectable()
export class AuthService implements OnModuleInit {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authMailService: AuthMailService,
    private readonly authSecurityService: AuthSecurityService,
  ) {}

  onModuleInit() {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

  async register(dto: RegisterDto) {
    const email = this.authSecurityService.normalizeEmail(dto.email);
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('El email ya esta registrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email,
      name: String(dto.name || '').trim(),
      passwordHash,
      role: dto.role ?? Role.USER,
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      authProvider: 'password',
    });

    return this.signAuthResponse(user.id, user.email, user.role, user.name);
  }

  async login(dto: LoginDto) {
    const email = this.authSecurityService.normalizeEmail(dto.email);
    this.authSecurityService.assertLoginRateLimit(email);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }

    if (user.authProvider === 'google') {
      throw new UnauthorizedException('Este usuario usa acceso con Google.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }

    this.authSecurityService.clearLoginRateLimit(email);

    return this.signAuthResponse(user.id, user.email, user.role, user.name);
  }

  async loginWithGoogle(dto: GoogleLoginDto) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Google login no esta configurado en el servidor.');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException('No se pudo validar el usuario de Google.');
    }

    const email = this.authSecurityService.normalizeEmail(payload.email);
    const name = String(payload.name || payload.email).trim();
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      const randomPasswordHash = await bcrypt.hash(this.authSecurityService.generateToken(), 12);
      user = await this.usersService.create({
        email,
        name,
        passwordHash: randomPasswordHash,
        role: Role.USER,
        emailVerified: true,
        authProvider: 'google',
      });
    } else {
      user.emailVerified = true;
      user.authProvider = user.authProvider || 'google';
      if (!user.name && name) {
        user.name = name;
      }
      await this.usersService.save(user);
    }

    return this.signAuthResponse(user.id, user.email, user.role, user.name);
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const email = this.authSecurityService.normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { message: 'Si el correo existe, te enviaremos instrucciones para recuperar acceso.' };
    }

    if (user.authProvider === 'google') {
      return { message: 'Tu cuenta usa Google. Inicia sesion con Google.' };
    }

    const resetToken = this.authSecurityService.generateToken();
    user.passwordResetTokenHash = this.authSecurityService.hashToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await this.usersService.save(user);

    await this.sendPasswordResetEmail(user.email, user.name, resetToken);
    return { message: 'Si el correo existe, te enviaremos instrucciones para recuperar acceso.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.authSecurityService.hashToken(dto.token);
    const user = await this.usersService.findByPasswordResetTokenHash(tokenHash);
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('El token de recuperacion es invalido o expirado.');
    }

    user.passwordHash = await bcrypt.hash(dto.password, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.emailVerified = true;
    await this.usersService.save(user);

    return { message: 'Contrasena actualizada correctamente.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = this.authSecurityService.hashToken(dto.token);
    const user = await this.usersService.findByEmailVerificationTokenHash(tokenHash);
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('El token de verificacion es invalido o expirado.');
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await this.usersService.save(user);

    return { message: 'Correo verificado correctamente.' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = this.authSecurityService.normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);

    if (!user || user.emailVerified) {
      return { message: 'Si el correo existe y esta pendiente, enviaremos un nuevo enlace.' };
    }

    const token = this.authSecurityService.generateToken();
    user.emailVerificationTokenHash = this.authSecurityService.hashToken(token);
    user.emailVerificationExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await this.usersService.save(user);

    await this.sendVerificationEmail(user.email, user.name, token);
    return { message: 'Si el correo existe y esta pendiente, enviaremos un nuevo enlace.' };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      authProvider: user.authProvider ?? 'password',
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.usersService.findByEmail(dto.email);
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Ese email ya esta en uso.');
      }
    }

    const updated = await this.usersService.updateProfile(userId, dto);
    if (!updated) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      emailVerified: updated.emailVerified,
      authProvider: updated.authProvider ?? 'password',
    };
  }

  private signAuthResponse(id: string, email: string, role: Role, name: string) {
    const payload = { sub: id, email, role, name };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id,
        email,
        role,
        name,
      },
    };
  }

  private getClientBaseUrl() {
    return this.configService.get<string>('APP_URL') || 'http://localhost:5173';
  }

  private async sendVerificationEmail(email: string, name: string, token: string) {
    const verifyUrl = `${this.getClientBaseUrl()}/login?verifyToken=${encodeURIComponent(token)}`;
    try {
      await this.authMailService.sendVerificationEmail(email, name, verifyUrl);
    } catch {
      // Never block auth flow if SMTP is temporarily unavailable.
    }
  }

  private async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetUrl = `${this.getClientBaseUrl()}/login?resetToken=${encodeURIComponent(token)}`;
    try {
      await this.authMailService.sendPasswordResetEmail(email, name, resetUrl);
    } catch {
      // Never block password-reset request response due to SMTP outage.
    }
  }
}
