import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { TierService } from '../tier/tier.service';

describe('WebhooksService.calculatePoints', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: {} },
        { provide: TierService, useValue: {} },
      ],
    }).compile();
    service = module.get(WebhooksService);
  });

  it('floors grandTotal / rate', () => {
    // 50.000 / 500 = 100 poin
    expect((service as any).calculatePoints(50000, 500)).toBe(100);
    // 55.000 / 1000 = 55 poin (floor)
    expect((service as any).calculatePoints(55000, 1000)).toBe(55);
  });

  it('returns 0 for non-positive total or rate', () => {
    expect((service as any).calculatePoints(0, 1000)).toBe(0);
    expect((service as any).calculatePoints(50000, 0)).toBe(0);
  });
});
