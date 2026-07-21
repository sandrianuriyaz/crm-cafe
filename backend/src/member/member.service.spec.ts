import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MemberService } from './member.service';
import { PrismaService } from '../prisma/prisma.service';
import { TierService } from '../tier/tier.service';

describe('MemberService.updateProfile', () => {
  let service: MemberService;
  let prisma: {
    member: { findUnique: jest.Mock; update: jest.Mock };
    user: { update: jest.Mock };
    $transaction: jest.Mock;
  };

  const member = {
    id: 'm1',
    userId: 'u1',
    memberCode: 'MBR-1',
    name: 'Lama',
    phone: '081111',
    pointBalance: 0,
    createdAt: new Date(),
    user: { email: null },
    tier: null,
  };

  beforeEach(async () => {
    prisma = {
      member: {
        findUnique: jest.fn().mockResolvedValue(member),
        update: jest.fn().mockResolvedValue({}),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
      // jalankan callback transaksi dengan tx = prisma mock itu sendiri
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: TierService,
          useValue: {
            statusForMember: jest.fn().mockResolvedValue({
              tier: 'bronze',
              monthlySpend: 0,
              rupiahPerPoint: 1000,
              nextTier: null,
            }),
          },
        },
      ],
    }).compile();
    service = module.get(MemberService);
  });

  it('updates member and syncs phone to the login user', async () => {
    await service.updateProfile('u1', { name: 'Baru', phone: '082222' });

    expect(prisma.member.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm1' },
        data: { name: 'Baru', phone: '082222' },
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { name: 'Baru', phone: '082222' },
      }),
    );
  });

  it('clears phone when given an empty string', async () => {
    await service.updateProfile('u1', { phone: '' });
    expect(prisma.member.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { phone: null } }),
    );
  });

  it('sets birthDate when provided', async () => {
    await service.updateProfile('u1', { birthDate: '2000-05-17' });
    expect(prisma.member.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { birthDate: new Date('2000-05-17') },
      }),
    );
    // birthDate tidak ada di User — tidak boleh ikut disinkron ke akun login.
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects changing birthDate once it is set', async () => {
    prisma.member.findUnique.mockResolvedValueOnce({
      ...member,
      birthDate: new Date('2000-05-17'),
    });
    await expect(
      service.updateProfile('u1', { birthDate: '1995-01-01' }),
    ).rejects.toBeInstanceOf(ConflictException);
    // Tidak boleh menyentuh DB sama sekali saat ditolak.
    expect(prisma.member.update).not.toHaveBeenCalled();
  });

  it('ignores a birthDate resent with the same value', async () => {
    prisma.member.findUnique.mockResolvedValueOnce({
      ...member,
      birthDate: new Date('2000-05-17'),
    });
    // Form mengirim ulang nilai yang sama bersama field lain — bukan perubahan,
    // jadi tidak boleh ditolak dan tidak ikut ditulis.
    await service.updateProfile('u1', {
      birthDate: '2000-05-17',
      name: 'Baru',
    });
    expect(prisma.member.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Baru' } }),
    );
  });

  it('throws 409 when the phone is already taken', async () => {
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
      }),
    );
    await expect(
      service.updateProfile('u1', { phone: '082222' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('MemberService.getProfile', () => {
  let service: MemberService;
  let prisma: { member: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = { member: { findUnique: jest.fn() } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: TierService,
          useValue: {
            statusForMember: jest.fn().mockResolvedValue({
              tier: 'gold',
              monthlySpend: 0,
              rupiahPerPoint: 1000,
              nextTier: null,
            }),
          },
        },
      ],
    }).compile();
    service = module.get(MemberService);
  });

  it('includes pendingEmail, hasPassword and emailVerified from the linked user', async () => {
    prisma.member.findUnique.mockResolvedValue({
      id: 'm1',
      userId: 'u1',
      memberCode: 'MBR-1',
      name: 'Budi',
      phone: '081111',
      birthDate: null,
      pointBalance: 10,
      createdAt: new Date(),
      user: {
        email: 'budi@x.com',
        pendingEmail: 'baru@x.com',
        passwordHash: 'hash',
        emailVerified: true,
      },
      tier: null,
    });

    const profile = await service.getProfile('u1');

    expect(profile.pendingEmail).toBe('baru@x.com');
    expect(profile.hasPassword).toBe(true);
    expect(profile.emailVerified).toBe(true);
  });

  it('reports hasPassword false and pendingEmail null for a Google-only account', async () => {
    prisma.member.findUnique.mockResolvedValue({
      id: 'm1',
      userId: 'u1',
      memberCode: 'MBR-1',
      name: 'Budi',
      phone: null,
      birthDate: null,
      pointBalance: 0,
      createdAt: new Date(),
      user: {
        email: 'budi@gmail.com',
        pendingEmail: null,
        passwordHash: null,
        emailVerified: false,
      },
      tier: null,
    });

    const profile = await service.getProfile('u1');

    expect(profile.pendingEmail).toBeNull();
    expect(profile.hasPassword).toBe(false);
    expect(profile.emailVerified).toBe(false);
  });
});
