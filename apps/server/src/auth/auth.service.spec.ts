import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@workspace/db';
import { AuthService } from './auth.service';
import { Profile } from 'passport-google-oauth20';

jest.mock('@workspace/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

function googleProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: 'google-123',
    displayName: 'Ada Lovelace',
    emails: [{ value: 'ada@example.com', verified: true }],
    photos: [{ value: 'https://example.com/ada.png' }],
    ...overrides,
  } as Profile;
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'ADMIN_EMAIL' ? 'info@dailycorner.in' : undefined,
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('creates a USER on first Google sign-in', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user_1',
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      image: 'https://example.com/ada.png',
      role: 'USER',
      status: 'ACTIVE',
    });

    const result = await service.upsertGoogleUser(googleProfile());

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'ada@example.com',
        googleId: 'google-123',
        role: 'USER',
      }),
    });
    expect(result.role).toBe('USER');
    expect(result.email).toBe('ada@example.com');
  });

  it('assigns ADMIN when the Google email is the platform admin', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'admin_1',
      email: 'info@dailycorner.in',
      name: 'Daily Corner',
      image: null,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const result = await service.upsertGoogleUser(
      googleProfile({
        emails: [{ value: 'info@dailycorner.in', verified: true }],
      } as Profile),
    );

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'info@dailycorner.in',
        role: 'ADMIN',
      }),
    });
    expect(result.role).toBe('ADMIN');
  });

  it('rejects Google accounts without an email', async () => {
    await expect(
      service.upsertGoogleUser(
        googleProfile({ emails: [] } as unknown as Profile),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
