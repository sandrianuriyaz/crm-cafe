import { Test, TestingModule } from '@nestjs/testing';
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
