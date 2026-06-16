import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { TwilioSignatureGuard } from './twilio-signature.guard';

const AUTH_TOKEN = 'test_auth_token';

function ctxWith(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function makeReq(opts: {
  signature?: string;
  body?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  const headers: Record<string, string> = {
    host: 'api.polks.test',
    ...(opts.signature ? { 'x-twilio-signature': opts.signature } : {}),
    ...(opts.headers ?? {}),
  };
  return {
    originalUrl: '/webhooks/whatsapp/inbound',
    protocol: 'https',
    body: opts.body ?? {},
    header: (name: string) => headers[name.toLowerCase()],
  };
}

// Hitung signature persis seperti guard (round-trip).
function sign(body: Record<string, string>): string {
  const url = 'https://api.polks.test/webhooks/whatsapp/inbound';
  const data = Object.keys(body)
    .sort()
    .reduce((acc, k) => acc + k + body[k], url);
  return createHmac('sha1', AUTH_TOKEN).update(Buffer.from(data, 'utf-8')).digest('base64');
}

function guardWith(verifyFlag?: string, authToken: string | undefined = AUTH_TOKEN) {
  const config = {
    get: (k: string) =>
      ({ TWILIO_AUTH_TOKEN: authToken, WHATSAPP_VERIFY_SIGNATURE: verifyFlag })[k],
  } as unknown as ConfigService;
  return new TwilioSignatureGuard(config);
}

describe('TwilioSignatureGuard', () => {
  it('bypasses when WHATSAPP_VERIFY_SIGNATURE=false (dev)', () => {
    expect(guardWith('false').canActivate(ctxWith(makeReq({})))).toBe(true);
  });

  it('accepts a correctly signed request', () => {
    const body = { From: 'whatsapp:+6281234567890', Body: 'halo [abc]' };
    const req = makeReq({ body, signature: sign(body) });
    expect(guardWith().canActivate(ctxWith(req))).toBe(true);
  });

  it('rejects a forged/missing signature', () => {
    const body = { From: 'whatsapp:+6280000000000', Body: 'halo [abc]' };
    const bad = makeReq({ body, signature: 'wrong-signature-value' });
    expect(() => guardWith().canActivate(ctxWith(bad))).toThrow(UnauthorizedException);

    const none = makeReq({ body });
    expect(() => guardWith().canActivate(ctxWith(none))).toThrow(UnauthorizedException);
  });

  it('rejects when auth token is not configured', () => {
    const body = { From: 'x' };
    const req = makeReq({ body, signature: 'whatever' });
    expect(() => guardWith(undefined, undefined).canActivate(ctxWith(req))).toThrow(
      UnauthorizedException,
    );
  });
});
