import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { HmacGuard } from './hmac.guard';
import { PrismaService } from '../../prisma/prisma.service';

const SECRET = 'test-secret';

function ctx(rawBody: string, headers: Record<string, string>) {
  const req = {
    rawBody: Buffer.from(rawBody, 'utf8'),
    header: (name: string) => headers[name.toLowerCase()],
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function sign(body: string) {
  return 'sha256=' + createHmac('sha256', SECRET).update(body).digest('hex');
}

describe('HmacGuard', () => {
  let guard: HmacGuard;
  let create: jest.Mock;

  beforeEach(() => {
    create = jest.fn().mockResolvedValue({});
    const config = { get: () => SECRET } as unknown as ConfigService;
    const prisma = { posSyncLog: { create } } as unknown as PrismaService;
    guard = new HmacGuard(config, prisma);
  });

  const body = JSON.stringify({
    idempotency_key: 'ORD-1',
    event_id: 'evt-1',
    transaction: { order_id: 'ORD-1' },
  });

  it('lolos untuk signature yang valid, tanpa menulis audit log', async () => {
    await expect(
      guard.canActivate(ctx(body, { 'x-signature': sign(body) })),
    ).resolves.toBe(true);
    expect(create).not.toHaveBeenCalled();
  });

  it('menolak signature salah dan mencatatnya sebagai invalid_signature', async () => {
    await expect(
      guard.canActivate(ctx(body, { 'x-signature': 'sha256=deadbeef' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toMatchObject({
      status: 'invalid_signature',
      idempotencyKey: 'ORD-1',
      eventId: 'evt-1',
      errorMessage: 'Invalid signature',
    });
  });

  it('mencatat header X-Signature yang hilang', async () => {
    await expect(guard.canActivate(ctx(body, {}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(create.mock.calls[0][0].data.errorMessage).toBe(
      'Missing X-Signature header',
    );
  });

  it('tetap mencatat walau body bukan JSON valid', async () => {
    await expect(
      guard.canActivate(ctx('bukan-json', { 'x-signature': 'sha256=abc' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    const data = create.mock.calls[0][0].data;
    expect(data.status).toBe('invalid_signature');
    expect(data.idempotencyKey).toBe('');
    expect(data.rawPayload).toEqual({ raw: 'bukan-json' });
  });

  it('kegagalan menulis audit log tidak mengubah hasil 401', async () => {
    create.mockRejectedValueOnce(new Error('db down'));
    await expect(
      guard.canActivate(ctx(body, { 'x-signature': 'sha256=deadbeef' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
