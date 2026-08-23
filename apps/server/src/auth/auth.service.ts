import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@workspace/db';
import type { UserRole } from '@workspace/db';
import type { Profile } from 'passport-google-oauth20';
import { toSessionUser } from './session-user';
import type { SessionUser } from '@workspace/types';

export type JwtPayload = {
  sub: string;
  email: string;
  role: SessionUser['role'];
};

const DEFAULT_ADMIN_EMAIL = 'info@dailycorner.in';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private adminEmail(): string {
    return (
      this.config.get<string>('ADMIN_EMAIL') ?? DEFAULT_ADMIN_EMAIL
    ).trim().toLowerCase();
  }

  private roleForEmail(email: string, current?: UserRole): UserRole {
    if (email === this.adminEmail()) {
      return 'ADMIN';
    }

    if (current === 'REPORTER') {
      return 'REPORTER';
    }

    return 'USER';
  }

  async upsertGoogleUser(profile: Profile): Promise<SessionUser> {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException(
        'Google did not provide an email for this account',
      );
    }

    const name = profile.displayName ?? null;
    const image = profile.photos?.[0]?.value ?? null;
    const now = new Date();

    const byGoogleId = await prisma.user.findUnique({
      where: { googleId },
    });

    if (byGoogleId) {
      if (byGoogleId.status !== 'ACTIVE') {
        throw new UnauthorizedException('This account is suspended');
      }

      const updated = await prisma.user.update({
        where: { id: byGoogleId.id },
        data: {
          email,
          name,
          image,
          role: this.roleForEmail(email, byGoogleId.role),
          lastLoginAt: now,
        },
      });

      return toSessionUser(updated);
    }

    const byEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (byEmail) {
      if (byEmail.status !== 'ACTIVE') {
        throw new UnauthorizedException('This account is suspended');
      }

      const linked = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId,
          name,
          image,
          role: this.roleForEmail(email, byEmail.role),
          lastLoginAt: now,
        },
      });

      return toSessionUser(linked);
    }

    const created = await prisma.user.create({
      data: {
        email,
        googleId,
        name,
        image,
        role: this.roleForEmail(email),
        lastLoginAt: now,
      },
    });

    return toSessionUser(created);
  }

  async signAccessToken(user: SessionUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }

  async getUserById(id: string): Promise<SessionUser> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    return toSessionUser(user);
  }
}
