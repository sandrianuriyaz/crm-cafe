import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OutletsService } from './outlets.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OutletsService', () => {
  let service: OutletsService;
  let prisma: {
    outlet: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      outlet: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'o1' }),
        update: jest.fn().mockResolvedValue({ id: 'o1' }),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutletsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(OutletsService);
  });

  it('listPublic only returns ACTIVE outlets', async () => {
    await service.listPublic();
    expect(prisma.outlet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'ACTIVE' } }),
    );
  });

  it('creates an outlet', async () => {
    await service.create({ name: 'POLKS Braga' });
    expect(prisma.outlet.create).toHaveBeenCalledWith({
      data: { name: 'POLKS Braga', hours: null },
    });
  });

  it('menurunkan label jam dari jadwal terstruktur saat create', async () => {
    await service.create({
      name: 'POLKS Braga',
      openTime: '09:00',
      closeTime: '21:00',
      closedDays: [0],
    });
    expect(prisma.outlet.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ hours: 'Senin - Sabtu 09:00 - 21:00' }),
    });
  });

  it('PATCH tanpa field jadwal tidak menghapus label jam', async () => {
    prisma.outlet.findUnique.mockResolvedValue({
      id: 'o1',
      openTime: '09:00',
      closeTime: '21:00',
      closedDays: [],
    });
    await service.update('o1', { status: 'INACTIVE' as never });
    expect(prisma.outlet.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: 'INACTIVE', hours: 'Setiap hari 09:00 - 21:00' },
    });
  });

  it('update throws 404 when outlet missing', async () => {
    prisma.outlet.findUnique.mockResolvedValue(null);
    await expect(service.update('nope', { city: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.outlet.update).not.toHaveBeenCalled();
  });

  it('remove deletes an existing outlet', async () => {
    prisma.outlet.findUnique.mockResolvedValue({ id: 'o1' });
    const res = await service.remove('o1');
    expect(prisma.outlet.delete).toHaveBeenCalledWith({ where: { id: 'o1' } });
    expect(res).toEqual({ id: 'o1', deleted: true });
  });
});
