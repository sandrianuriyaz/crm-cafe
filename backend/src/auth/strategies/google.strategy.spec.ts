import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';

const config = {
  get: (k: string) =>
    ({
      GOOGLE_CLIENT_ID: 'x',
      GOOGLE_CLIENT_SECRET: 'x',
      GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/v1/auth/google/callback',
    })[k],
} as unknown as ConfigService;

function profile(overrides: Record<string, unknown>) {
  return {
    emails: [{ value: 'a@gmail.com' }],
    displayName: 'Andi',
    _json: { email_verified: true },
    ...overrides,
  } as never;
}

describe('GoogleStrategy.validate', () => {
  const strat = new GoogleStrategy(config);

  it('accepts a verified Google email', () => {
    const done = jest.fn();
    strat.validate('at', 'rt', profile({}), done);
    expect(done).toHaveBeenCalledWith(null, { email: 'a@gmail.com', name: 'Andi' });
  });

  it('rejects an unverified Google email', () => {
    const done = jest.fn();
    strat.validate('at', 'rt', profile({ _json: { email_verified: false } }), done);
    expect(done.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(done.mock.calls[0][1]).toBeUndefined();
  });

  it('rejects when no email is present', () => {
    const done = jest.fn();
    strat.validate('at', 'rt', profile({ emails: [] }), done);
    expect(done.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
