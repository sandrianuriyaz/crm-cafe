import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('AuthService.login', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('rejects login for OTP users without a passwordHash', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'otp@x',
      role: 'CUSTOMER',
      passwordHash: null, // user OTP, tak punya password
      member: null,
    });

    await expect(
      service.login({ email: 'otp@x', password: 'whatever' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login when the email is unknown', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nope@x', password: 'whatever' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.loginByGoogle', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    member: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      member: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('jwt') },
        },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('logs in an existing user matched by email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@gmail.com',
      role: 'CUSTOMER',
      name: 'Andi',
      member: { memberCode: 'MBR-1', pointBalance: 50 },
    });
    const res = await service.loginByGoogle({
      email: 'A@Gmail.com',
      name: 'Andi',
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(res).toEqual(
      expect.objectContaining({
        access_token: 'jwt',
        user: expect.objectContaining({
          id: 'u1',
          memberCode: 'MBR-1',
          pointBalance: 50,
        }),
      }),
    );
  });

  it('creates a new user + member for a first-time Google login', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u2',
      email: 'new@gmail.com',
      role: 'CUSTOMER',
      name: 'Baru',
    });
    prisma.member.create.mockResolvedValue({
      memberCode: 'MBR-2',
      pointBalance: 0,
    });

    const res = await service.loginByGoogle({
      email: 'new@gmail.com',
      name: 'Baru',
    });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new@gmail.com',
          role: 'CUSTOMER',
        }),
      }),
    );
    expect(res.user).toEqual(
      expect.objectContaining({
        id: 'u2',
        memberCode: 'MBR-2',
        pointBalance: 0,
      }),
    );
  });
});

describe('AuthService.requestEmailChange', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    authToken: { updateMany: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };
  let mail: { sendEmailChangeConfirmation: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      authToken: { updateMany: jest.fn(), create: jest.fn() },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };
    mail = { sendEmailChangeConfirmation: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: MailService, useValue: mail },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('rejects accounts without a password (Google-only)', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'old@x.com',
      passwordHash: null,
    });

    await expect(
      service.requestEmailChange('u1', 'new@x.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the new email equals the current email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'same@x.com',
      passwordHash: 'hash',
    });

    await expect(
      service.requestEmailChange('u1', 'same@x.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the new email is already used by another account', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', email: 'old@x.com', passwordHash: 'hash' })
      .mockResolvedValueOnce({ id: 'u2', email: 'taken@x.com' });

    await expect(
      service.requestEmailChange('u1', 'taken@x.com'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('sets pendingEmail and emails the new address', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({
        id: 'u1',
        email: 'old@x.com',
        name: 'Budi',
        passwordHash: 'hash',
      })
      .mockResolvedValueOnce(null);

    await service.requestEmailChange('u1', 'NEW@x.com');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { pendingEmail: 'new@x.com' },
      }),
    );
    expect(mail.sendEmailChangeConfirmation).toHaveBeenCalledWith(
      'new@x.com',
      'Budi',
      expect.stringContaining('/auth/confirm-email-change?token='),
    );
  });
});
