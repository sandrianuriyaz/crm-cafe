import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyConfigService } from './loyalty-config.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LoyaltyConfigService', () => {
  let service: LoyaltyConfigService;
  let prisma: { loyaltyConfig: { upsert: jest.Mock } };

  beforeEach(async () => {
    prisma = { loyaltyConfig: { upsert: jest.fn().mockResolvedValue({}) } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyConfigService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(LoyaltyConfigService);
  });

  it('get() upserts the singleton with defaults on create', async () => {
    await service.get();
    expect(prisma.loyaltyConfig.upsert).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });
  });

  it('update() upserts with the given fields', async () => {
    await service.update({ rupiahPerPoint: 500 });
    expect(prisma.loyaltyConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'singleton' },
        update: expect.objectContaining({ rupiahPerPoint: 500 }),
      }),
    );
  });
});
