import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const realtimeMock = { emitPointsChanged: jest.fn() };

describe('AdminService.markVoucherUsed', () => {
  let service: AdminService;
  let prisma: { voucher: { findUnique: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      voucher: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'v1', status: 'USED' }),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeGateway, useValue: realtimeMock },
      ],
    }).compile();
    service = module.get(AdminService);
  });

  it('marks an ACTIVE voucher as USED with usedAt', async () => {
    prisma.voucher.findUnique.mockResolvedValue({ id: 'v1', status: 'ACTIVE' });
    await service.markVoucherUsed('v1');
    expect(prisma.voucher.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'v1' },
        data: expect.objectContaining({
          status: 'USED',
          usedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('rejects when voucher is not ACTIVE', async () => {
    prisma.voucher.findUnique.mockResolvedValue({ id: 'v1', status: 'USED' });
    await expect(service.markVoucherUsed('v1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.voucher.update).not.toHaveBeenCalled();
  });

  it('throws 404 when voucher does not exist', async () => {
    prisma.voucher.findUnique.mockResolvedValue(null);
    await expect(service.markVoucherUsed('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('AdminService.stats', () => {
  let service: AdminService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      member: { count: jest.fn().mockResolvedValue(12) },
      transaction: { count: jest.fn().mockResolvedValue(34) },
      pointHistory: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { points: 500 } }),
      },
      redeem: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { pointsSpent: 120 } }),
      },
      outlet: { count: jest.fn().mockResolvedValue(3) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeGateway, useValue: realtimeMock },
      ],
    }).compile();
    service = module.get(AdminService);
  });

  it('aggregates totals and returns a 6-month points flow', async () => {
    const res = await service.stats();
    expect(res).toEqual(
      expect.objectContaining({
        totalMembers: 12,
        totalTransactions: 34,
        pointsIssued: 500,
        pointsRedeemed: 120,
        activeOutlets: 3,
      }),
    );
    expect(res.pointsFlow).toHaveLength(6);
    expect(res.pointsFlow[0]).toEqual(
      expect.objectContaining({ issued: 0, redeemed: 0 }),
    );
  });

  it('defaults points to 0 when aggregates are empty', async () => {
    prisma.pointHistory.aggregate.mockResolvedValue({ _sum: { points: null } });
    prisma.redeem.aggregate.mockResolvedValue({ _sum: { pointsSpent: null } });
    const res = await service.stats();
    expect(res.pointsIssued).toBe(0);
    expect(res.pointsRedeemed).toBe(0);
  });
});

describe('AdminService.listTransactions', () => {
  let service: AdminService;
  let prisma: {
    transaction: { findMany: jest.Mock; count: jest.Mock };
    outlet: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      transaction: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      outlet: { findUnique: jest.fn() },
      $transaction: jest
        .fn()
        .mockImplementation((arr: Promise<unknown>[]) => Promise.all(arr)),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeGateway, useValue: realtimeMock },
      ],
    }).compile();
    service = module.get(AdminService);
  });

  it('lists all transactions unfiltered when no outletId is given', async () => {
    await service.listTransactions(0, 20);
    expect(prisma.outlet.findUnique).not.toHaveBeenCalled();
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('resolves outletId to storeId and filters by it', async () => {
    prisma.outlet.findUnique.mockResolvedValue({ storeId: 'store-a' });
    await service.listTransactions(0, 20, 'outlet-1');
    expect(prisma.outlet.findUnique).toHaveBeenCalledWith({
      where: { id: 'outlet-1' },
      select: { storeId: true },
    });
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { storeId: 'store-a' } }),
    );
  });

  it('returns an empty result without querying transactions when the outlet has no storeId', async () => {
    prisma.outlet.findUnique.mockResolvedValue({ storeId: null });
    const res = await service.listTransactions(0, 20, 'outlet-1');
    expect(prisma.transaction.findMany).not.toHaveBeenCalled();
    expect(res).toEqual({ total: 0, skip: 0, take: 20, items: [] });
  });
});
