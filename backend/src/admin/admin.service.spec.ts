import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

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
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
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
