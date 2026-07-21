import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { TierService } from '../tier/tier.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

describe('WebhooksService.calculatePoints', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: {} },
        { provide: TierService, useValue: {} },
        {
          provide: RealtimeGateway,
          useValue: {
            emitPointsChanged: jest.fn(),
            emitTierUp: jest.fn(),
          },
        },
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

describe('WebhooksService.upsertMember', () => {
  let service: WebhooksService;

  // Stub Prisma transaction client: `found` menentukan hasil tiap findUnique
  // berdasarkan field yang dicari.
  function makeTx(found: {
    memberCode?: unknown;
    externalCustomerId?: unknown;
    phone?: unknown;
  }) {
    return {
      member: {
        findUnique: jest.fn(({ where }: any) => {
          if ('memberCode' in where) return found.memberCode ?? null;
          if ('externalCustomerId' in where)
            return found.externalCustomerId ?? null;
          if ('phone' in where) return found.phone ?? null;
          return null;
        }),
        update: jest.fn(({ data }: any) => ({ id: 'm1', ...data })),
        create: jest.fn(({ data }: any) => ({ id: 'new', ...data })),
      },
    };
  }

  const event = (customer: Record<string, unknown>) =>
    ({ customer, transaction: { order_id: 'o1', grand_total: 50000 } }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: {} },
        { provide: TierService, useValue: {} },
        {
          provide: RealtimeGateway,
          useValue: { emitPointsChanged: jest.fn(), emitTierUp: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(WebhooksService);
  });

  it('matches the member whose QR was scanned (customer.id = memberCode)', async () => {
    const existing = {
      id: 'm1',
      memberCode: 'MBR-ABC',
      phone: '081234567890',
      name: 'Ziaa',
      externalCustomerId: null,
    };
    const tx = makeTx({ memberCode: existing });

    const result = await (service as any).upsertMember(
      tx,
      event({ id: 'MBR-ABC' }),
    );

    expect(tx.member.create).not.toHaveBeenCalled();
    expect(result.id).toBe('m1');
  });

  it('persists a POS-internal customer.id as externalCustomerId', async () => {
    // POS mengirim id internalnya (bukan memberCode kita) dan belum ada member
    // yang memegangnya → member baru harus MENYIMPAN id itu, supaya transaksi
    // berikutnya cocok dan poin menumpuk di member yang sama.
    const tx = makeTx({});

    await (service as any).upsertMember(tx, event({ id: 'POS-999' }));

    expect(tx.member.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ externalCustomerId: 'POS-999' }),
      }),
    );
  });

  it('finds a member by a previously stored POS id', async () => {
    const existing = {
      id: 'm1',
      memberCode: 'MBR-ABC',
      phone: null,
      name: null,
      externalCustomerId: 'POS-999',
    };
    const tx = makeTx({ externalCustomerId: existing });

    const result = await (service as any).upsertMember(
      tx,
      event({ id: 'POS-999' }),
    );

    expect(tx.member.create).not.toHaveBeenCalled();
    expect(result.id).toBe('m1');
  });

  it('matches by phone regardless of +62 / 0 formatting', async () => {
    const existing = {
      id: 'm1',
      memberCode: 'MBR-ABC',
      phone: '081234567890',
      name: 'Ziaa',
      externalCustomerId: null,
    };
    const tx = makeTx({ phone: existing });

    await (service as any).upsertMember(
      tx,
      event({ phone: '+62 812-3456-7890' }),
    );

    expect(tx.member.findUnique).toHaveBeenCalledWith({
      where: { phone: '081234567890' },
    });
    expect(tx.member.create).not.toHaveBeenCalled();
  });

  it('does not overwrite an external id already held by the member', async () => {
    const existing = {
      id: 'm1',
      memberCode: 'MBR-ABC',
      phone: null,
      name: null,
      externalCustomerId: 'POS-111',
    };
    const tx = makeTx({ memberCode: existing });

    await (service as any).upsertMember(tx, event({ id: 'MBR-ABC' }));

    expect(tx.member.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ externalCustomerId: 'POS-111' }),
      }),
    );
  });

  it('returns null for an anonymous walk-in', async () => {
    const tx = makeTx({});
    const result = await (service as any).upsertMember(
      tx,
      event({ id: null, phone: null, name: 'Pelanggan Umum' }),
    );
    expect(result).toBeNull();
    expect(tx.member.create).not.toHaveBeenCalled();
  });
});
