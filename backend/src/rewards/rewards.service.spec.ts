import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RewardsService.listAll', () => {
  let service: RewardsService;
  let prisma: {
    reward: { findMany: jest.Mock; count: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      reward: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest
        .fn()
        .mockImplementation((arr: Promise<unknown>[]) => Promise.all(arr)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RewardsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(RewardsService);
  });

  it('queries with no filter when nothing is passed', async () => {
    await service.listAll({ skip: 0, take: 20 });
    expect(prisma.reward.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('filters by status', async () => {
    await service.listAll({ skip: 0, take: 20, status: 'INACTIVE' } as any);
    expect(prisma.reward.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ status: 'INACTIVE' }] },
      }),
    );
  });

  it('filters by type', async () => {
    await service.listAll({ skip: 0, take: 20, type: 'FREE_ITEM' } as any);
    expect(prisma.reward.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ type: 'FREE_ITEM' }] },
      }),
    );
  });

  it('combines search, status, and type together', async () => {
    await service.listAll({
      skip: 0,
      take: 20,
      search: 'kopi',
      status: 'ACTIVE',
      type: 'DISCOUNT_PERCENT',
    } as any);
    expect(prisma.reward.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: 'kopi', mode: 'insensitive' } },
                { description: { contains: 'kopi', mode: 'insensitive' } },
              ],
            },
            { status: 'ACTIVE' },
            { type: 'DISCOUNT_PERCENT' },
          ],
        },
      }),
    );
  });
});

describe('RewardsService outlet tagging', () => {
  let service: RewardsService;
  let prisma: {
    reward: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    rewardOutlet: { deleteMany: jest.Mock; createMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      reward: {
        create: jest.fn().mockResolvedValue({ id: 'r1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'r1' }),
        update: jest.fn().mockResolvedValue({ id: 'r1' }),
      },
      rewardOutlet: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockImplementation((arg) =>
        Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
      ),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [RewardsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(RewardsService);
  });

  describe('create', () => {
    it('creates without nested outlets when outletIds is not given', async () => {
      await service.create({ name: 'Tumbler', pointCost: 100, stock: 1 } as any);
      expect(prisma.reward.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ outlets: undefined }),
        }),
      );
    });

    it('creates nested RewardOutlet rows when outletIds is given', async () => {
      await service.create({
        name: 'Tumbler',
        pointCost: 100,
        stock: 1,
        outletIds: ['o1', 'o2'],
      } as any);
      expect(prisma.reward.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            outlets: { create: [{ outletId: 'o1' }, { outletId: 'o2' }] },
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('does not touch outlet tags when outletIds is omitted', async () => {
      await service.update('r1', { name: 'Baru' } as any);
      expect(prisma.rewardOutlet.deleteMany).not.toHaveBeenCalled();
      expect(prisma.rewardOutlet.createMany).not.toHaveBeenCalled();
      expect(prisma.reward.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'r1' } }),
      );
    });

    it('replaces outlet tags when outletIds is given', async () => {
      await service.update('r1', { outletIds: ['o3'] } as any);
      expect(prisma.rewardOutlet.deleteMany).toHaveBeenCalledWith({
        where: { rewardId: 'r1' },
      });
      expect(prisma.rewardOutlet.createMany).toHaveBeenCalledWith({
        data: [{ rewardId: 'r1', outletId: 'o3' }],
      });
    });

    it('clears all outlet tags when outletIds is an empty array', async () => {
      await service.update('r1', { outletIds: [] } as any);
      expect(prisma.rewardOutlet.deleteMany).toHaveBeenCalledWith({
        where: { rewardId: 'r1' },
      });
      expect(prisma.rewardOutlet.createMany).not.toHaveBeenCalled();
    });

    it('throws 404 when the reward does not exist', async () => {
      prisma.reward.findUnique.mockResolvedValue(null);
      await expect(
        service.update('nope', { name: 'x' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
