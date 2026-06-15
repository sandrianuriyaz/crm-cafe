import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { OtpService } from './otp.service';
import { OTP_SENDER, OtpSender } from './otp-sender';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: {
    otpCode: {
      count: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let sender: { send: jest.Mock };
  let auth: { loginByPhone: jest.Mock };

  beforeEach(async () => {
    prisma = {
      otpCode: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'otp1', ...data })),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    sender = { send: jest.fn().mockResolvedValue(undefined) };
    auth = {
      loginByPhone: jest
        .fn()
        .mockResolvedValue({ access_token: 'jwt', user: { id: 'u1' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: auth },
        { provide: OTP_SENDER, useValue: sender as unknown as OtpSender },
      ],
    }).compile();

    service = module.get(OtpService);
  });

  describe('request', () => {
    it('stores a hashed code (not plaintext) and sends it', async () => {
      await service.request({ phone: '081234567890', channel: 'whatsapp' });

      expect(prisma.otpCode.create).toHaveBeenCalledTimes(1);
      const stored = prisma.otpCode.create.mock.calls[0][0].data;
      expect(stored.phone).toBe('081234567890');
      expect(stored.channel).toBe('whatsapp');
      expect(stored.codeHash).not.toMatch(/^\d{6}$/); // bukan kode polos

      expect(sender.send).toHaveBeenCalledTimes(1);
      const sent = sender.send.mock.calls[0][0];
      expect(sent.phone).toBe('081234567890');
      expect(sent.code).toMatch(/^\d{6}$/);
      // kode yang dikirim cocok dengan hash yang disimpan
      expect(await bcrypt.compare(sent.code, stored.codeHash)).toBe(true);
    });

    it('rejects invalid phone numbers', async () => {
      await expect(
        service.request({ phone: 'abc', channel: 'sms' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(sender.send).not.toHaveBeenCalled();
    });

    it('enforces resend cooldown', async () => {
      prisma.otpCode.findFirst.mockResolvedValueOnce({
        id: 'recent',
        createdAt: new Date(), // baru saja dibuat
        consumedAt: null,
      });
      await expect(
        service.request({ phone: '081234567890', channel: 'whatsapp' }),
      ).rejects.toBeInstanceOf(HttpException);
      expect(sender.send).not.toHaveBeenCalled();
    });

    it('does not persist the code if sending fails', async () => {
      sender.send.mockRejectedValueOnce(new Error('twilio down'));
      await expect(
        service.request({ phone: '081234567890', channel: 'sms' }),
      ).rejects.toBeTruthy();
      // baris yang sempat dibuat harus dibersihkan
      expect(prisma.otpCode.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'otp1' } }),
      );
    });
  });

  describe('verify', () => {
    it('rejects when no active code exists', async () => {
      prisma.otpCode.findFirst.mockResolvedValueOnce(null);
      await expect(
        service.verify({ phone: '081234567890', code: '123456' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(auth.loginByPhone).not.toHaveBeenCalled();
    });

    it('increments attempts and rejects a wrong code', async () => {
      const codeHash = await bcrypt.hash('111111', 10);
      prisma.otpCode.findFirst.mockResolvedValueOnce({
        id: 'otp1',
        codeHash,
        attempts: 0,
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      await expect(
        service.verify({ phone: '081234567890', code: '000000' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.otpCode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'otp1' },
          data: { attempts: 1 },
        }),
      );
      expect(auth.loginByPhone).not.toHaveBeenCalled();
    });

    it('rejects after too many attempts', async () => {
      const codeHash = await bcrypt.hash('111111', 10);
      prisma.otpCode.findFirst.mockResolvedValueOnce({
        id: 'otp1',
        codeHash,
        attempts: 5,
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      await expect(
        service.verify({ phone: '081234567890', code: '111111' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(auth.loginByPhone).not.toHaveBeenCalled();
    });

    it('consumes the code and logs in on success', async () => {
      const codeHash = await bcrypt.hash('482913', 10);
      prisma.otpCode.findFirst.mockResolvedValueOnce({
        id: 'otp1',
        codeHash,
        attempts: 0,
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      const res = await service.verify({
        phone: '081234567890',
        code: '482913',
      });
      expect(prisma.otpCode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'otp1' },
          data: expect.objectContaining({ consumedAt: expect.any(Date) }),
        }),
      );
      expect(auth.loginByPhone).toHaveBeenCalledWith('081234567890');
      expect(res).toEqual({ access_token: 'jwt', user: { id: 'u1' } });
    });
  });
});
