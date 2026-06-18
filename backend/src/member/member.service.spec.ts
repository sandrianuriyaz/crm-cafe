import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MemberService } from './member.service';
import { PrismaService } from '../prisma/prisma.service';
import { TierService } from '../tier/tier.service';

describe('MemberService.updateProfile', () => {
  let service: MemberService;
  let prisma: {
    member: { findUnique: jest.Mock; update: jest.Mock };
    user: { update: jest.Mock };
    $transaction: jest.Mock;
  };

  const member = {
    id: 'm1',
    userId: 'u1',
    memberCode: 'MBR-1',
    name: 'Lama',
    phone: '081111',
    pointBalance: 0,
    createdAt: new Date(),
    user: { email: null },
    tier: null,
  };

  beforeEach(async () => {
    prisma = {
      member: {
        findUnique: jest.fn().mockResolvedValue(member),
        update: jest.fn().mockResolvedValue({}),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
      // jalankan callback transaksi dengan tx = prisma mock itu sendiri
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: TierService,
          useValue: {
            statusForMember: jest.fn().mockResolvedValue({
              tier: 'bronze',
              monthlySpend: 0,
              rupiahPerPoint: 1000,
              nextTier: null,
            }),
          },
        },
      ],
    }).compile();
    service = module.get(MemberService);
  });

  it('updates member and syncs phone to the login user', async () => {
    await service.updateProfile('u1', { name: 'Baru', phone: '082222' });

    expect(prisma.member.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm1' },
        data: { name: 'Baru', phone: '082222' },
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { name: 'Baru', phone: '082222' },
      }),
    );
  });

  it('clears phone when given an empty string', async () => {
    await service.updateProfile('u1', { phone: '' });
    expect(prisma.member.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { phone: null } }),
    );
  });

  it('throws 409 when the phone is already taken', async () => {
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
      }),
    );
    await expect(
      service.updateProfile('u1', { phone: '082222' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
