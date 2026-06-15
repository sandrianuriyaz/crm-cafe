import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WebhooksService earning rate', () => {
  let service: WebhooksService;
  let prisma: { loyaltyConfig: { findUnique: jest.Mock } };
  let config: { get: jest.Mock };

  beforeEach(async () => {
    prisma = { loyaltyConfig: { findUnique: jest.fn() } };
    config = { get: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(WebhooksService);
  });

  it('calculatePoints uses the configured rupiahPerPoint', () => {
    // 50.000 / 500 = 100 poin
    expect((service as any).calculatePoints(50000, 500)).toBe(100);
  });

  it('calculatePoints returns 0 for non-positive total', () => {
    expect((service as any).calculatePoints(0, 1000)).toBe(0);
  });

  it('getRupiahPerPoint prefers LoyaltyConfig when set', async () => {
    prisma.loyaltyConfig.findUnique.mockResolvedValue({ rupiahPerPoint: 500 });
    await expect((service as any).getRupiahPerPoint()).resolves.toBe(500);
    expect(config.get).not.toHaveBeenCalled();
  });

  it('getRupiahPerPoint falls back to env when config absent', async () => {
    prisma.loyaltyConfig.findUnique.mockResolvedValue(null);
    config.get.mockReturnValue(2000);
    await expect((service as any).getRupiahPerPoint()).resolves.toBe(2000);
  });
});
