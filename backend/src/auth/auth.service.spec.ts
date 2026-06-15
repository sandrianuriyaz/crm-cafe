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
