import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WaLoginService } from './wa-login.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

describe('WaLoginService', () => {
  let service: WaLoginService;
  let prisma: {
    waLoginRequest: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let auth: { loginByPhone: jest.Mock };

  const config = {
    get: (k: string) =>
      ({
        FRONTEND_URL: 'https://app.polks.test',
        WHATSAPP_BUSINESS_NUMBER: '14155238886',
      })[k],
  };

  beforeEach(async () => {
    prisma = {
      waLoginRequest: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    auth = {
      loginByPhone: jest
        .fn()
        .mockResolvedValue({ access_token: 'jwt', user: { id: 'u1' } }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaLoginService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: auth },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(WaLoginService);
  });

  it('request creates a token and a wa.me url containing it', async () => {
    const { token, waUrl } = await service.request();
    expect(token).toMatch(/^[a-f0-9]{24}$/);
    expect(prisma.waLoginRequest.create).toHaveBeenCalled();
    expect(waUrl).toContain('https://wa.me/14155238886');
    expect(decodeURIComponent(waUrl)).toContain(`[${token}]`);
  });

  it('claim marks request claimed with normalized phone', async () => {
    prisma.waLoginRequest.findUnique.mockResolvedValue({
      token: 't',
      consumedAt: null,
      claimedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });
    const ok = await service.claim('t', 'whatsapp:+6281234567890');
    expect(ok).toBe(true);
    expect(prisma.waLoginRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: '081234567890' }),
      }),
    );
  });

  it('claim rejects expired request', async () => {
    prisma.waLoginRequest.findUnique.mockResolvedValue({
      token: 't',
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await service.claim('t', 'whatsapp:+6281234567890')).toBe(false);
  });

  it('exchange returns pending when not yet claimed', async () => {
    prisma.waLoginRequest.findUnique.mockResolvedValue({
      token: 't',
      phone: null,
      claimedAt: null,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });
    expect(await service.exchange('t')).toEqual({ status: 'pending' });
  });

  it('exchange logs in when claimed (single-use)', async () => {
    prisma.waLoginRequest.findUnique.mockResolvedValue({
      token: 't',
      phone: '081234567890',
      claimedAt: new Date(),
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });
    const res = await service.exchange('t');
    expect(auth.loginByPhone).toHaveBeenCalledWith('081234567890');
    expect(res).toEqual({ status: 'ok', access_token: 'jwt', user: { id: 'u1' } });
  });

  it('exchange returns consumed when another caller won the race', async () => {
    prisma.waLoginRequest.findUnique.mockResolvedValue({
      token: 't',
      phone: '081234567890',
      claimedAt: new Date(),
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });
    prisma.waLoginRequest.updateMany.mockResolvedValue({ count: 0 });
    expect(await service.exchange('t')).toEqual({ status: 'consumed' });
    expect(auth.loginByPhone).not.toHaveBeenCalled();
  });

  it('exchange returns expired for an old request', async () => {
    prisma.waLoginRequest.findUnique.mockResolvedValue({
      token: 't',
      phone: '081234567890',
      claimedAt: new Date(),
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await service.exchange('t')).toEqual({ status: 'expired' });
  });
});
