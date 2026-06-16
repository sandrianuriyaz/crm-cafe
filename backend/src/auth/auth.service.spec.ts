import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

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
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('jwt') } },
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
    const res = await service.loginByGoogle({ email: 'A@Gmail.com', name: 'Andi' });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(res).toEqual(
      expect.objectContaining({
        access_token: 'jwt',
        user: expect.objectContaining({ id: 'u1', memberCode: 'MBR-1', pointBalance: 50 }),
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
    prisma.member.create.mockResolvedValue({ memberCode: 'MBR-2', pointBalance: 0 });

    const res = await service.loginByGoogle({ email: 'new@gmail.com', name: 'Baru' });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'new@gmail.com', role: 'CUSTOMER' }),
      }),
    );
    expect(res.user).toEqual(
      expect.objectContaining({ id: 'u2', memberCode: 'MBR-2', pointBalance: 0 }),
    );
  });
});
