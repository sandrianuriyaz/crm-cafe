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

describe('MemberService.getTransactions', () => {
  let service: MemberService;
  let prisma: {
    member: { findUnique: jest.Mock };
    transaction: { findMany: jest.Mock; count: jest.Mock };
    outlet: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const member = {
    id: 'm1',
    userId: 'u1',
    memberCode: 'MBR-1',
    name: 'Zia',
    phone: '081111',
    pointBalance: 100,
    createdAt: new Date(),
    user: { email: null },
    tier: null,
  };

  beforeEach(async () => {
    prisma = {
      member: { findUnique: jest.fn().mockResolvedValue(member) },
      transaction: {
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
      outlet: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ storeId: 'store-1', name: 'Cafe A' }]),
      },
      $transaction: jest
        .fn()
        .mockImplementation((arr: Promise<unknown>[]) => Promise.all(arr)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: PrismaService, useValue: prisma },
        { provide: TierService, useValue: { statusForMember: jest.fn() } },
      ],
    }).compile();
    service = module.get(MemberService);
  });

  it('resolves outletName from the matching outlet storeId', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 't1',
        posOrderNumber: 'ORD-1',
        storeId: 'store-1',
        status: 'selesai',
        grandTotal: 55000,
        paymentMethod: 'QRIS',
        pointsAwarded: 55,
        occurredAt: new Date('2026-06-12'),
        createdAt: new Date('2026-06-12'),
        items: [
          { name: 'Cookies & Cream', qty: 1, lineTotal: 55000, isReward: false },
        ],
      },
    ]);

    const result = await service.getTransactions('u1', 0, 20);

    expect(prisma.outlet.findMany).toHaveBeenCalledWith({
      where: { storeId: { in: ['store-1'] } },
      select: { storeId: true, name: true },
    });
    expect(result.items[0]).toMatchObject({
      id: 't1',
      outletName: 'Cafe A',
      status: 'selesai',
    });
    expect(result.items[0]).not.toHaveProperty('storeId');
  });

  it('falls back to null outletName when storeId has no matching outlet', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 't2',
        posOrderNumber: 'ORD-2',
        storeId: 'store-unknown',
        status: 'selesai',
        grandTotal: 10000,
        paymentMethod: 'Cash',
        pointsAwarded: 10,
        occurredAt: null,
        createdAt: new Date('2026-06-01'),
        items: [],
      },
    ]);
    prisma.outlet.findMany.mockResolvedValue([]);

    const result = await service.getTransactions('u1', 0, 20);
    expect(result.items[0].outletName).toBeNull();
  });

  it('skips the outlet lookup entirely when no transaction has a storeId', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 't3',
        posOrderNumber: null,
        storeId: null,
        status: null,
        grandTotal: 20000,
        paymentMethod: null,
        pointsAwarded: 0,
        occurredAt: null,
        createdAt: new Date('2026-05-01'),
        items: [],
      },
    ]);

    const result = await service.getTransactions('u1', 0, 20);
    expect(prisma.outlet.findMany).not.toHaveBeenCalled();
    expect(result.items[0].outletName).toBeNull();
  });
});
