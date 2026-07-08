import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PromosService } from './promos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PromosService outlet tagging', () => {
  let service: PromosService;
  let prisma: {
    promo: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    promoOutlet: { deleteMany: jest.Mock; createMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      promo: {
        create: jest.fn().mockResolvedValue({ id: 'p1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'p1' }),
        update: jest.fn().mockResolvedValue({ id: 'p1' }),
      },
      promoOutlet: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      // Dua bentuk $transaction dipakai kode: array-of-promises (listAll) dan
      // callback (update) — mock keduanya sekaligus.
      $transaction: jest.fn().mockImplementation((arg) =>
        Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
      ),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromosService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PromosService);
  });

  describe('create', () => {
    it('creates without nested outlets when outletIds is not given', async () => {
      await service.create({ title: 'Diskon' } as any);
      expect(prisma.promo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ outlets: undefined }),
        }),
      );
    });

    it('creates nested PromoOutlet rows when outletIds is given', async () => {
      await service.create({ title: 'Diskon', outletIds: ['o1', 'o2'] } as any);
      expect(prisma.promo.create).toHaveBeenCalledWith(
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
      await service.update('p1', { title: 'Baru' } as any);
      expect(prisma.promoOutlet.deleteMany).not.toHaveBeenCalled();
      expect(prisma.promoOutlet.createMany).not.toHaveBeenCalled();
      expect(prisma.promo.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'p1' } }),
      );
    });

    it('replaces outlet tags when outletIds is given', async () => {
      await service.update('p1', { outletIds: ['o3'] } as any);
      expect(prisma.promoOutlet.deleteMany).toHaveBeenCalledWith({
        where: { promoId: 'p1' },
      });
      expect(prisma.promoOutlet.createMany).toHaveBeenCalledWith({
        data: [{ promoId: 'p1', outletId: 'o3' }],
      });
    });

    it('clears all outlet tags when outletIds is an empty array', async () => {
      await service.update('p1', { outletIds: [] } as any);
      expect(prisma.promoOutlet.deleteMany).toHaveBeenCalledWith({
        where: { promoId: 'p1' },
      });
      expect(prisma.promoOutlet.createMany).not.toHaveBeenCalled();
    });

    it('throws 404 when the promo does not exist', async () => {
      prisma.promo.findUnique.mockResolvedValue(null);
      await expect(
        service.update('nope', { title: 'x' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
