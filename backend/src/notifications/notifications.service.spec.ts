import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    member: { findMany: jest.Mock; findUnique: jest.Mock };
    broadcast: { create: jest.Mock; findMany: jest.Mock; count: jest.Mock };
    notification: {
      createMany: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      updateMany: jest.Mock;
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      member: {
        findMany: jest.fn().mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]),
        findUnique: jest.fn().mockResolvedValue({ id: 'm1' }),
      },
      broadcast: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      notification: {
        createMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        findFirst: jest.fn(),
      },
      // jalankan array operasi seolah transaksi
      $transaction: jest.fn().mockImplementation((ops) => Promise.resolve(ops)),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeGateway, useValue: { emitNotification: jest.fn() } },
      ],
    }).compile();
    service = module.get(NotificationsService);
  });

  it('broadcast creates a record + one notification per targeted member', async () => {
    const res = await service.broadcast({
      title: 'Promo',
      message: 'Halo',
      target: 'all',
    });
    expect(res).toEqual({ recipientCount: 2 });
    expect(prisma.broadcast.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          target: 'all',
          recipientCount: 2,
          imageUrl: null,
        }),
      }),
    );
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        { memberId: 'm1', title: 'Promo', message: 'Halo', imageUrl: null },
        { memberId: 'm2', title: 'Promo', message: 'Halo', imageUrl: null },
      ],
    });
  });

  it('broadcast passes imageUrl through to the broadcast record and every notification', async () => {
    await service.broadcast({
      title: 'Promo',
      message: 'Halo',
      target: 'all',
      imageUrl: 'https://example.com/banner.png',
    });
    expect(prisma.broadcast.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          imageUrl: 'https://example.com/banner.png',
        }),
      }),
    );
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        {
          memberId: 'm1',
          title: 'Promo',
          message: 'Halo',
          imageUrl: 'https://example.com/banner.png',
        },
        {
          memberId: 'm2',
          title: 'Promo',
          message: 'Halo',
          imageUrl: 'https://example.com/banner.png',
        },
      ],
    });
  });

  it('targets gold members by point range', async () => {
    await service.broadcast({ title: 'G', message: 'x', target: 'gold' });
    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: { not: null },
          pointBalance: { gte: 1000, lt: 5000 },
        }),
      }),
    );
  });

  it('targets inactive members (no recent transactions)', async () => {
    await service.broadcast({ title: 'I', message: 'x', target: 'inactive' });
    const where = prisma.member.findMany.mock.calls[0][0].where;
    expect(where.userId).toEqual({ not: null });
    expect(where.transactions.none.createdAt.gte).toBeInstanceOf(Date);
  });

  it('markAllRead marks unread notifications of the member', async () => {
    const res = await service.markAllRead('u1');
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { memberId: 'm1', readAt: null },
        data: expect.objectContaining({ readAt: expect.any(Date) }),
      }),
    );
    expect(res).toEqual({ updated: 2 });
  });
});
