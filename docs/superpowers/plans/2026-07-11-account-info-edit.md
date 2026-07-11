# Edit + Redesign Informasi Akun — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the "Informasi Akun" page (name, email, phone) editable, and redesign it as a "Docket" (printed cafe membership slip) instead of a generic icon-list card.

**Architecture:** Name/phone update immediately via the existing `PATCH /member/profile`. Email changes go through a new confirm-by-link flow (`User.pendingEmail` + a new `EMAIL_CHANGE` `AuthToken` type, mirroring the existing `EMAIL_VERIFY` flow) because email doubles as the login identifier. Google-only accounts (no `passwordHash`) have the email field locked, because Google login matches purely by `email` with no separate `googleId`. The frontend page is rewritten with a receipt/ticket-styled card ("Docket": perforated top edge, dotted-leader rows, monospace values, a rotated tier "stamp" using the existing `TIER_META` colors).

**Tech Stack:** NestJS + Prisma (backend), Next.js App Router + Tailwind (frontend), Jest with mocked Prisma (backend tests).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-11-account-info-edit-design.md` — read it before starting; this plan implements it verbatim.
- No new color tokens — reuse `tailwind.config.ts` (`polks-brand`, `polks-card`, `polks-border`, `polks-bg`, `polks-text`, `polks-text-soft`, `polks-muted`, `polks-point`) and `frontend/src/lib/loyalty/tier.ts`'s `TIER_META`.
- Backend error messages are user-facing Indonesian strings (matches existing `auth.service.ts` conventions) — copy the exact strings given in each step.
- All new backend endpoints go through the existing `ValidationPipe({ whitelist: true, transform: true })` — DTOs with `class-validator` decorators are required, plain objects will be silently stripped.
- Frontend `api()` (`frontend/src/lib/api.ts`) already calls `JSON.stringify()` on its `body` option — **never** pre-stringify the body yourself (a real bug from doing this in 4 other pages was just fixed on `development`; don't reintroduce it).
- Header navy block + back button on `app/profile/account/page.tsx` stays exactly as-is (Keputusan #7 in the spec) — only the content card below it changes.

---

### Task 1: Prisma schema — `pendingEmail` field + `EMAIL_CHANGE` token type

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: `AuthTokenType.EMAIL_CHANGE` enum value, `User.pendingEmail: string | null` field — consumed by Tasks 2–5.

- [ ] **Step 1: Add `EMAIL_CHANGE` to the `AuthTokenType` enum**

In `backend/prisma/schema.prisma`, find:

```prisma
enum AuthTokenType {
  PASSWORD_RESET
  EMAIL_VERIFY
}
```

Replace with:

```prisma
enum AuthTokenType {
  PASSWORD_RESET
  EMAIL_VERIFY
  EMAIL_CHANGE
}
```

- [ ] **Step 2: Add `pendingEmail` to the `User` model**

Find the `User` model's `emailVerifiedAt` line:

```prisma
  emailVerified   Boolean   @default(false)
  emailVerifiedAt DateTime?
```

Replace with:

```prisma
  emailVerified   Boolean   @default(false)
  emailVerifiedAt DateTime?
  // Email baru menunggu konfirmasi lewat link (lihat AuthTokenType.EMAIL_CHANGE).
  // Tidak unique di level DB — dicek di level aplikasi, race ditangkap via
  // P2002 pada `email` (yang memang unique) saat konfirmasi.
  pendingEmail    String?
```

- [ ] **Step 3: Generate and apply the migration**

Run (requires the local Postgres to be reachable — stop `npm run start:dev` first if it's running, same as noted in prior migrations):

```bash
cd backend && npx prisma migrate dev --name add_email_change_pending_field
```

Expected: prompts nothing (non-destructive additive change), prints `Your database is now in sync with your schema.` and generates a new folder under `backend/prisma/migrations/<timestamp>_add_email_change_pending_field/migration.sql` containing an `ALTER TYPE` and an `ALTER TABLE ... ADD COLUMN "pendingEmail"`.

- [ ] **Step 4: Verify the Prisma client regenerated correctly**

```bash
cd backend && npx tsc --noEmit -p tsconfig.json
```

Expected: no errors (this only type-checks; `prisma migrate dev` already ran `prisma generate` for you).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(auth): add pendingEmail field and EMAIL_CHANGE token type"
```

---

### Task 2: Backend — `POST /auth/email-change/request`

**Files:**
- Create: `backend/src/auth/dto/email-change-request.dto.ts`
- Modify: `backend/src/mail/mail.service.ts`
- Modify: `backend/src/auth/auth.service.ts`
- Modify: `backend/src/auth/auth.controller.ts`
- Test: `backend/src/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `AuthTokenType.EMAIL_CHANGE`, `User.pendingEmail` (Task 1); `AuthService.makeToken()`, `AuthService.frontendBase()` (existing private helpers).
- Produces: `AuthService.requestEmailChange(userId: string, rawEmail: string): Promise<{ message: string }>` — consumed by Task 8 (frontend) and referenced by Task 3/4's shared understanding of the flow.

- [ ] **Step 1: Write the failing test**

Open `backend/src/auth/auth.service.spec.ts` and append this new `describe` block at the end of the file:

```typescript
describe('AuthService.requestEmailChange', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    authToken: { updateMany: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };
  let mail: { sendEmailChangeConfirmation: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      authToken: { updateMany: jest.fn(), create: jest.fn() },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };
    mail = { sendEmailChangeConfirmation: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: MailService, useValue: mail },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('rejects accounts without a password (Google-only)', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'old@x.com',
      passwordHash: null,
    });

    await expect(
      service.requestEmailChange('u1', 'new@x.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the new email equals the current email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'same@x.com',
      passwordHash: 'hash',
    });

    await expect(
      service.requestEmailChange('u1', 'same@x.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the new email is already used by another account', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', email: 'old@x.com', passwordHash: 'hash' })
      .mockResolvedValueOnce({ id: 'u2', email: 'taken@x.com' });

    await expect(
      service.requestEmailChange('u1', 'taken@x.com'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('sets pendingEmail and emails the new address', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({
        id: 'u1',
        email: 'old@x.com',
        name: 'Budi',
        passwordHash: 'hash',
      })
      .mockResolvedValueOnce(null);

    await service.requestEmailChange('u1', 'NEW@x.com');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { pendingEmail: 'new@x.com' },
      }),
    );
    expect(mail.sendEmailChangeConfirmation).toHaveBeenCalledWith(
      'new@x.com',
      'Budi',
      expect.stringContaining('/auth/confirm-email-change?token='),
    );
  });
});
```

This uses `BadRequestException` and `ConflictException`, already imported at the top of the file via `import { UnauthorizedException } from '@nestjs/common';` — check the existing import line and extend it:

Find:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
```

Replace with:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd backend && npx jest auth/auth.service.spec.ts -t "requestEmailChange"
```

Expected: FAIL — `TypeError: service.requestEmailChange is not a function`.

- [ ] **Step 3: Create the request DTO**

Create `backend/src/auth/dto/email-change-request.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EmailChangeRequestDto {
  @ApiProperty({ example: 'baru@example.com' })
  @IsEmail()
  email!: string;
}
```

- [ ] **Step 4: Add the mail template**

In `backend/src/mail/mail.service.ts`, find the `sendEmailVerification` method and add a new method right after it (before the `private layout(...)` method):

```typescript
  async sendEmailChangeConfirmation(to: string, name: string, confirmUrl: string) {
    const subject = 'Konfirmasi perubahan email POLKS';
    const text =
      `Halo ${name},\n\n` +
      `Ada permintaan mengubah email akun POLKS kamu ke alamat ini. Konfirmasi dengan membuka tautan berikut:\n` +
      `${confirmUrl}\n\n` +
      `Tautan berlaku 24 jam. Abaikan email ini bila kamu tidak meminta perubahan email.`;
    const html = this.layout(
      `Halo <b>${name}</b>,`,
      `Kami menerima permintaan mengubah email akun POLKS kamu ke alamat ini. Klik tombol di bawah untuk mengonfirmasi. Tautan berlaku <b>24 jam</b>.`,
      'Konfirmasi Email Baru',
      confirmUrl,
      'Abaikan email ini bila kamu tidak meminta perubahan email.',
    );
    await this.send(to, subject, html, text);
  }
```

- [ ] **Step 5: Implement `requestEmailChange` in `AuthService`**

In `backend/src/auth/auth.service.ts`, add a new constant near the top (next to `EMAIL_VERIFY_TTL_MS`):

Find:
```typescript
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
```

Replace with:
```typescript
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
const EMAIL_CHANGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
```

Then add the method right after `verifyEmail(...)` (still inside the `// ── Verifikasi email ──` section, before the `// ── Helper token sekali-pakai ──` comment):

```typescript
  // ── Ganti email (identitas login) ───────────────────────────────────────────

  async requestEmailChange(userId: string, rawEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    // Akun Google-only tidak punya password — Google login dicocokkan murni
    // via email (tidak ada googleId terpisah), jadi email di sini tak boleh diubah.
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Akun ini masuk lewat Google, email tidak bisa diubah di sini',
      );
    }

    const email = rawEmail.toLowerCase().trim();
    if (email === user.email) {
      throw new BadRequestException('Email baru sama dengan email saat ini');
    }

    const conflict = await this.prisma.user.findUnique({ where: { email } });
    if (conflict) {
      throw new ConflictException('Email sudah dipakai akun lain');
    }

    const { token, tokenHash } = this.makeToken();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { pendingEmail: email },
      }),
      this.prisma.authToken.updateMany({
        where: { userId, type: AuthTokenType.EMAIL_CHANGE, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.authToken.create({
        data: {
          userId,
          type: AuthTokenType.EMAIL_CHANGE,
          tokenHash,
          expiresAt: new Date(Date.now() + EMAIL_CHANGE_TTL_MS),
        },
      }),
    ]);

    const url = `${this.frontendBase()}/auth/confirm-email-change?token=${token}`;
    await this.mail.sendEmailChangeConfirmation(email, user.name, url);
    return { message: 'Tautan konfirmasi telah dikirim ke email baru.' };
  }
```

- [ ] **Step 6: Wire the controller route**

In `backend/src/auth/auth.controller.ts`, add the import:

Find:
```typescript
import { VerifyEmailDto } from './dto/verify-email.dto';
```

Replace with:
```typescript
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailChangeRequestDto } from './dto/email-change-request.dto';
```

Then add the route right after the `verifyEmail` endpoint (still before the `// ── 2FA (TOTP) ──` comment):

```typescript
  // ── Ganti email ──────────────────────────────────────────────────────────

  @Post('email-change/request')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Minta ganti email — kirim link konfirmasi ke email baru' })
  requestEmailChange(
    @CurrentUser() user: AuthUser,
    @Body() dto: EmailChangeRequestDto,
  ) {
    return this.auth.requestEmailChange(user.id, dto.email);
  }
```

- [ ] **Step 7: Run the test to verify it passes**

```bash
cd backend && npx jest auth/auth.service.spec.ts -t "requestEmailChange"
```

Expected: PASS — 4 tests.

- [ ] **Step 8: Commit**

```bash
git add backend/src/auth/dto/email-change-request.dto.ts backend/src/mail/mail.service.ts backend/src/auth/auth.service.ts backend/src/auth/auth.controller.ts backend/src/auth/auth.service.spec.ts
git commit -m "feat(auth): add POST /auth/email-change/request"
```

---

### Task 3: Backend — `POST /auth/email-change/confirm`

**Files:**
- Create: `backend/src/auth/dto/email-change-confirm.dto.ts`
- Modify: `backend/src/auth/auth.service.ts`
- Modify: `backend/src/auth/auth.controller.ts`
- Test: `backend/src/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `AuthService.consumeToken(token, type)` (existing private helper).
- Produces: `AuthService.confirmEmailChange(token: string): Promise<{ message: string; email: string }>` — consumed by Task 8 (`app/auth/confirm-email-change/page.tsx`).

- [ ] **Step 1: Write the failing test**

Append to `backend/src/auth/auth.service.spec.ts`:

```typescript
describe('AuthService.confirmEmailChange', () => {
  let service: AuthService;
  let prisma: {
    authToken: { findUnique: jest.Mock; update: jest.Mock };
    user: { findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      authToken: { findUnique: jest.fn(), update: jest.fn() },
      user: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('rejects an unknown or already-used token', async () => {
    prisma.authToken.findUnique.mockResolvedValue(null);

    await expect(service.confirmEmailChange('bad-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an expired token', async () => {
    prisma.authToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      type: 'EMAIL_CHANGE',
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.confirmEmailChange('tok')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects when there is no pending email (already cancelled)', async () => {
    prisma.authToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      type: 'EMAIL_CHANGE',
      usedAt: null,
      expiresAt: new Date(Date.now() + 1000),
    });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', pendingEmail: null });

    await expect(service.confirmEmailChange('tok')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('applies the pending email and marks the token used', async () => {
    prisma.authToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      type: 'EMAIL_CHANGE',
      usedAt: null,
      expiresAt: new Date(Date.now() + 1000),
    });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', pendingEmail: 'new@x.com' });

    const res = await service.confirmEmailChange('tok');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          email: 'new@x.com',
          pendingEmail: null,
          emailVerified: true,
        }),
      }),
    );
    expect(res).toEqual({ message: 'Email berhasil diperbarui.', email: 'new@x.com' });
  });

  it('rejects with 409 if the pending email was taken by someone else in the meantime', async () => {
    prisma.authToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      type: 'EMAIL_CHANGE',
      usedAt: null,
      expiresAt: new Date(Date.now() + 1000),
    });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', pendingEmail: 'taken@x.com' });
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
      }),
    );

    await expect(service.confirmEmailChange('tok')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
```

This test uses `Prisma.PrismaClientKnownRequestError`, which needs a new import. Find:
```typescript
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
```

Replace with:
```typescript
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd backend && npx jest auth/auth.service.spec.ts -t "confirmEmailChange"
```

Expected: FAIL — `TypeError: service.confirmEmailChange is not a function`.

- [ ] **Step 3: Create the confirm DTO**

Create `backend/src/auth/dto/email-change-confirm.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EmailChangeConfirmDto {
  @ApiProperty({ example: 'a1b2c3...', description: 'Token dari tautan email' })
  @IsString()
  token!: string;
}
```

- [ ] **Step 4: Implement `confirmEmailChange` in `AuthService`**

Add this method in `backend/src/auth/auth.service.ts`, right after `requestEmailChange` (the one just added in Task 2):

```typescript
  async confirmEmailChange(token: string) {
    const record = await this.consumeToken(token, AuthTokenType.EMAIL_CHANGE);
    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user?.pendingEmail) {
      throw new BadRequestException('Tidak ada perubahan email yang menunggu');
    }

    try {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: record.userId },
          data: {
            email: user.pendingEmail,
            pendingEmail: null,
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        }),
        this.prisma.authToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
      ]);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Email sudah dipakai akun lain, minta ulang perubahan',
        );
      }
      throw err;
    }

    return { message: 'Email berhasil diperbarui.', email: user.pendingEmail };
  }
```

- [ ] **Step 5: Wire the controller route**

In `backend/src/auth/auth.controller.ts`, add the import:

Find:
```typescript
import { EmailChangeRequestDto } from './dto/email-change-request.dto';
```

Replace with:
```typescript
import { EmailChangeRequestDto } from './dto/email-change-request.dto';
import { EmailChangeConfirmDto } from './dto/email-change-confirm.dto';
```

Then add the route right after the `requestEmailChange` route added in Task 2:

```typescript
  @Post('email-change/confirm')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Konfirmasi ganti email pakai token dari email' })
  confirmEmailChange(@Body() dto: EmailChangeConfirmDto) {
    return this.auth.confirmEmailChange(dto.token);
  }
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd backend && npx jest auth/auth.service.spec.ts -t "confirmEmailChange"
```

Expected: PASS — 5 tests.

- [ ] **Step 7: Commit**

```bash
git add backend/src/auth/dto/email-change-confirm.dto.ts backend/src/auth/auth.service.ts backend/src/auth/auth.controller.ts backend/src/auth/auth.service.spec.ts
git commit -m "feat(auth): add POST /auth/email-change/confirm"
```

---

### Task 4: Backend — `POST /auth/email-change/cancel`

**Files:**
- Modify: `backend/src/auth/auth.service.ts`
- Modify: `backend/src/auth/auth.controller.ts`
- Test: `backend/src/auth/auth.service.spec.ts`

**Interfaces:**
- Produces: `AuthService.cancelEmailChange(userId: string): Promise<{ message: string }>` — consumed by Task 8.

- [ ] **Step 1: Write the failing test**

Append to `backend/src/auth/auth.service.spec.ts`:

```typescript
describe('AuthService.cancelEmailChange', () => {
  let service: AuthService;
  let prisma: {
    user: { update: jest.Mock };
    authToken: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: { update: jest.fn() },
      authToken: { updateMany: jest.fn() },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('clears the pending email and invalidates outstanding tokens', async () => {
    await service.cancelEmailChange('u1');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { pendingEmail: null } }),
    );
    expect(prisma.authToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', type: AuthTokenType.EMAIL_CHANGE, usedAt: null },
      }),
    );
  });
});
```

`AuthTokenType` needs to be imported in the test file. Find:
```typescript
import { Prisma } from '@prisma/client';
```

Replace with:
```typescript
import { AuthTokenType, Prisma } from '@prisma/client';
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd backend && npx jest auth/auth.service.spec.ts -t "cancelEmailChange"
```

Expected: FAIL — `TypeError: service.cancelEmailChange is not a function`.

- [ ] **Step 3: Implement `cancelEmailChange` in `AuthService`**

Add this method right after `confirmEmailChange` (added in Task 3):

```typescript
  async cancelEmailChange(userId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { pendingEmail: null },
      }),
      this.prisma.authToken.updateMany({
        where: { userId, type: AuthTokenType.EMAIL_CHANGE, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: 'Perubahan email dibatalkan.' };
  }
```

- [ ] **Step 4: Wire the controller route**

In `backend/src/auth/auth.controller.ts`, add the route right after `confirmEmailChange` (added in Task 3):

```typescript
  @Post('email-change/cancel')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batalkan perubahan email yang menunggu konfirmasi' })
  cancelEmailChange(@CurrentUser() user: AuthUser) {
    return this.auth.cancelEmailChange(user.id);
  }
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd backend && npx jest auth/auth.service.spec.ts -t "cancelEmailChange"
```

Expected: PASS — 1 test.

- [ ] **Step 6: Run the full auth test suite**

```bash
cd backend && npx jest auth/auth.service.spec.ts
```

Expected: PASS — all tests in the file (login, loginByGoogle, requestEmailChange, confirmEmailChange, cancelEmailChange).

- [ ] **Step 7: Commit**

```bash
git add backend/src/auth/auth.service.ts backend/src/auth/auth.controller.ts backend/src/auth/auth.service.spec.ts
git commit -m "feat(auth): add POST /auth/email-change/cancel"
```

---

### Task 5: Backend — expose `pendingEmail`, `hasPassword`, `emailVerified` on `GET /member/profile`

**Files:**
- Modify: `backend/src/member/member.service.ts`
- Test: `backend/src/member/member.service.spec.ts`

**Interfaces:**
- Consumes: `getMemberOrThrow()`'s existing `include: { user: true, tier: true }` (already fetches the full `User` row, no query change needed).
- Produces: `MemberService.getProfile()` response gains `pendingEmail: string | null`, `hasPassword: boolean`, `emailVerified: boolean` — consumed by Task 8 (frontend Docket page).

**Note:** `emailVerified` is being added here too, not just `pendingEmail`/`hasPassword`. It was never actually in the response despite the frontend already reading `p.emailVerified` for the "email belum diverifikasi" banner — a pre-existing gap discovered while planning this task, directly adjacent to the code being touched here, so it's fixed in the same step rather than filed separately.

- [ ] **Step 1: Write the failing test**

Open `backend/src/member/member.service.spec.ts` and add a new `describe` block at the end of the file (after the existing `describe('MemberService.updateProfile', ...)` block):

```typescript
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd backend && npx jest member/member.service.spec.ts -t "getProfile"
```

Expected: FAIL — `expect(received).toBe(expected)` on `profile.pendingEmail` (currently `undefined`).

- [ ] **Step 3: Implement the field additions**

In `backend/src/member/member.service.ts`, find the `getProfile` method:

```typescript
  async getProfile(userId: string) {
    const m = await this.getMemberOrThrow(userId);
    // Tier dihitung dari belanja bulan ini (bukan saldo poin).
    const status = await this.tier.statusForMember(m.id);
    return {
      id: m.id,
      memberCode: m.memberCode,
      name: m.name,
      email: m.user?.email ?? null,
      phone: m.phone,
      birthDate: m.birthDate,
      pointBalance: m.pointBalance,
      tier: status.tier,
      monthlySpend: status.monthlySpend,
      rupiahPerPoint: status.rupiahPerPoint,
      nextTier: status.nextTier,
      createdAt: m.createdAt,
    };
  }
```

Replace with:

```typescript
  async getProfile(userId: string) {
    const m = await this.getMemberOrThrow(userId);
    // Tier dihitung dari belanja bulan ini (bukan saldo poin).
    const status = await this.tier.statusForMember(m.id);
    return {
      id: m.id,
      memberCode: m.memberCode,
      name: m.name,
      email: m.user?.email ?? null,
      phone: m.phone,
      birthDate: m.birthDate,
      pointBalance: m.pointBalance,
      tier: status.tier,
      monthlySpend: status.monthlySpend,
      rupiahPerPoint: status.rupiahPerPoint,
      nextTier: status.nextTier,
      createdAt: m.createdAt,
      emailVerified: m.user?.emailVerified ?? false,
      pendingEmail: m.user?.pendingEmail ?? null,
      hasPassword: !!m.user?.passwordHash,
    };
  }
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd backend && npx jest member/member.service.spec.ts
```

Expected: PASS — all tests in the file (updateProfile's 4 tests + getProfile's 2 new tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/member/member.service.ts backend/src/member/member.service.spec.ts
git commit -m "feat(member): expose pendingEmail, hasPassword, emailVerified on GET /member/profile"
```

---

### Task 6: Frontend — `app/auth/confirm-email-change/page.tsx`

**Files:**
- Create: `frontend/src/app/auth/confirm-email-change/page.tsx`

**Interfaces:**
- Consumes: `POST /auth/email-change/confirm` (Task 3), `api()` from `@/lib/api`.

- [ ] **Step 1: Create the page**

Create `frontend/src/app/auth/confirm-email-change/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";

type State = "loading" | "success" | "error";

function ConfirmEmailChangeContent() {
  const params = useSearchParams();
  const token  = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) { setState("error"); return; }
    api("/auth/email-change/confirm", {
      method: "POST",
      body: { token },
    })
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 px-8 pt-10 text-center">
        <div className="skeleton size-16 rounded-full" />
        <p className="text-[14px] text-polks-muted">Mengonfirmasi email baru…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-5 px-8 pt-10 text-center">
        <CheckCircle2 size={64} className="text-green-500" strokeWidth={1.5} />
        <div>
          <p className="text-[20px] font-bold text-polks-text">Email berhasil diperbarui!</p>
          <p className="mt-2 text-[13px] leading-relaxed text-polks-muted">
            Login berikutnya pakai email baru ini.
          </p>
        </div>
        <Link
          href="/profile/account"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white"
        >
          Ke Informasi Akun
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 px-8 pt-10 text-center">
      <XCircle size={64} className="text-polks-error" strokeWidth={1.5} />
      <div>
        <p className="text-[20px] font-bold text-polks-text">Konfirmasi gagal</p>
        <p className="mt-2 text-[13px] leading-relaxed text-polks-muted">
          Tautan sudah kedaluwarsa, tidak valid, atau perubahan sudah dibatalkan. Minta ulang dari halaman Informasi Akun.
        </p>
      </div>
      <Link
        href="/profile/account"
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white"
      >
        Ke Informasi Akun
      </Link>
    </div>
  );
}

export default function ConfirmEmailChangePage() {
  return (
    <main className="flex min-h-screen justify-center bg-polks-card font-body text-polks-text md:bg-transparent">
      <div className="polks-phone flex min-h-screen w-full flex-col bg-polks-card">
        <Suspense>
          <ConfirmEmailChangeContent />
        </Suspense>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/auth/confirm-email-change/page.tsx
git commit -m "feat(auth): add /auth/confirm-email-change page"
```

---

### Task 7: Frontend — redesign `app/profile/account/page.tsx` as "Docket" with edit mode

**Files:**
- Modify: `frontend/src/app/profile/account/page.tsx`

**Interfaces:**
- Consumes: `GET /member/profile` (now returns `pendingEmail`, `hasPassword`, `emailVerified` — Task 5), `PATCH /member/profile` (existing), `POST /auth/email-change/request` (Task 2), `POST /auth/email-change/cancel` (Task 4), `TIER_META` from `@/lib/loyalty/tier`.

This is a full rewrite of one self-contained page component — there's no meaningful intermediate state between "old list UI" and "new Docket UI" worth splitting into separate tasks (a half-migrated card isn't independently useful). Verification happens in Task 8.

- [ ] **Step 1: Replace the whole file**

Replace the entire contents of `frontend/src/app/profile/account/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Phone, IdCard, Calendar, ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TIER_META } from "@/lib/loyalty/tier";

type MemberProfile = {
  memberCode: string;
  name: string;
  email: string;
  phone: string | null;
  pointBalance: number;
  createdAt: string;
  emailVerified: boolean;
  pendingEmail: string | null;
  hasPassword: boolean;
};

function formatJoined(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function DocketRow({
  label, icon: Icon, children,
}: { label: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5 py-1.5">
      <Icon size={11} className="mb-0.5 shrink-0 text-polks-muted" />
      <span className="whitespace-nowrap text-[10.5px] text-polks-muted">{label}</span>
      <span className="mb-0.5 h-px flex-1 border-b border-dotted border-[#D7DCDF]" />
      {children}
    </div>
  );
}

export default function AccountInfoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [p, setP]               = useState<MemberProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [sendingVerif, setSendingVerif] = useState(false);
  const [verifSent, setVerifSent]       = useState(false);

  const [editing, setEditing]     = useState(false);
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingBusy, setPendingBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    let alive = true;
    api<MemberProfile>("/member/profile")
      .then((d) => {
        if (!alive) return;
        setP(d);
        setName(d.name);
        setPhone(d.phone ?? "");
        setEmail(d.email);
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) { router.replace("/login"); return; }
        setError("Gagal memuat data akun. Coba lagi.");
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  };

  useEffect(load, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const tierMeta = TIER_META[user?.tier ?? "bronze"];

  function startEdit() {
    if (!p) return;
    setName(p.name);
    setPhone(p.phone ?? "");
    setEmail(p.email);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError(null);
  }

  async function onSave() {
    if (!p) return;
    setSaving(true);
    setSaveError(null);
    try {
      const nameChanged  = name.trim() !== p.name;
      const phoneChanged = phone.trim() !== (p.phone ?? "");
      const emailChanged = p.hasPassword && email.trim().toLowerCase() !== p.email.toLowerCase();

      if (nameChanged || phoneChanged) {
        await api("/member/profile", {
          method: "PATCH",
          body: {
            ...(nameChanged ? { name: name.trim() } : {}),
            ...(phoneChanged ? { phone: phone.trim() } : {}),
          },
        });
      }
      if (emailChanged) {
        await api("/auth/email-change/request", {
          method: "POST",
          body: { email: email.trim() },
        });
      }
      setEditing(false);
      load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  async function resendPending() {
    if (!p?.pendingEmail) return;
    setPendingBusy(true);
    try {
      await api("/auth/email-change/request", {
        method: "POST",
        body: { email: p.pendingEmail },
      });
    } catch {
      // best-effort — banner tetap tampil, user bisa coba lagi
    } finally {
      setPendingBusy(false);
    }
  }

  async function cancelPending() {
    setPendingBusy(true);
    try {
      await api("/auth/email-change/cancel", { method: "POST" });
      load();
    } catch {
      // best-effort
    } finally {
      setPendingBusy(false);
    }
  }

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          aria-label="Kembali"
          className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors active:bg-white/20"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Informasi Akun</h1>
        <p className="mt-1 text-[13px] text-white/50">Detail data membership kamu.</p>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="bg-polks-bg px-5 pb-10">
        {loading ? (
          <div className="relative mt-1 overflow-hidden rounded-2xl border border-polks-border bg-polks-card p-4">
            <div className="skeleton mx-auto mb-4 h-4 w-32 rounded" />
            <div className="skeleton mb-2 h-3 w-full rounded" />
            <div className="skeleton mb-2 h-3 w-full rounded" />
            <div className="skeleton mb-4 h-3 w-full rounded" />
            <div className="skeleton mb-2 h-3 w-full rounded" />
            <div className="skeleton h-3 w-full rounded" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-polks-border bg-polks-card p-6 text-center">
            <p className="text-sm text-polks-muted">{error}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-polks-brand px-5 py-2.5 text-xs font-bold text-white"
            >
              Coba Lagi
            </button>
          </div>
        ) : p ? (
          <>
            <div className="relative mt-1 rounded-2xl border border-polks-border bg-polks-card px-4 pb-4 pt-5 shadow-[0_1px_0_#E6EAED,0_8px_20px_rgba(23,33,42,0.06)]">
              {/* Perforasi */}
              <div className="absolute inset-x-2.5 -top-1 flex justify-between">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className="size-2 rounded-full bg-polks-bg" />
                ))}
              </div>

              {/* Cap tier */}
              <div
                className="absolute right-3.5 top-3.5 flex size-[46px] -rotate-[9deg] flex-col items-center justify-center rounded-full border"
                style={{ borderColor: tierMeta.badgeText, backgroundColor: tierMeta.badgeBg }}
              >
                <span className="mb-0.5 size-1 rounded-full bg-polks-point" />
                <b className="text-[7.5px] font-bold tracking-wide" style={{ color: tierMeta.badgeText }}>
                  {tierMeta.label.toUpperCase()}
                </b>
              </div>

              <p className="text-center text-[17px] font-bold text-polks-text">{p.name}</p>
              <div className="my-3 border-t border-dotted border-polks-border" />

              <div className="mb-1 flex items-center justify-between">
                <span className="text-[8.5px] font-bold tracking-widest text-polks-muted">DATA PRIBADI</span>
                {editing ? (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-[9.5px] font-bold text-polks-muted underline underline-offset-2"
                  >
                    Batal
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="text-[9.5px] font-bold text-polks-text underline decoration-polks-point decoration-2 underline-offset-2"
                  >
                    Edit
                  </button>
                )}
              </div>

              <DocketRow label="Nama" icon={User}>
                {editing ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-28 border-b border-polks-point bg-transparent text-right font-mono text-[11px] font-semibold text-polks-text outline-none"
                  />
                ) : (
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-polks-text-soft">
                    {p.name}
                  </span>
                )}
              </DocketRow>

              <DocketRow label="Email" icon={Mail}>
                {editing ? (
                  p.hasPassword ? (
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-36 border-b border-polks-point bg-transparent text-right font-mono text-[11px] font-semibold text-polks-text outline-none"
                    />
                  ) : (
                    <span className="text-right text-[9px] italic text-polks-muted">
                      Akun Google, tidak bisa diubah
                    </span>
                  )
                ) : (
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-polks-text-soft">
                    {p.email}
                  </span>
                )}
              </DocketRow>

              <DocketRow label="No. HP" icon={Phone}>
                {editing ? (
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-28 border-b border-polks-point bg-transparent text-right font-mono text-[11px] font-semibold text-polks-text outline-none"
                  />
                ) : (
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-polks-text-soft">
                    {p.phone || "—"}
                  </span>
                )}
              </DocketRow>

              {saveError ? (
                <p className="mt-1 text-right text-[10.5px] text-polks-error">{saveError}</p>
              ) : null}

              <div className="relative my-4 -mx-4 border-t border-dashed border-polks-border">
                <span className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-polks-bg" />
                <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full bg-polks-bg" />
              </div>

              <span className="text-[8.5px] font-bold tracking-widest text-polks-muted">DATA TERSIMPAN</span>

              <div className={editing ? "opacity-50" : undefined}>
                <DocketRow label="Member ID" icon={IdCard}>
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-polks-text-soft">
                    {p.memberCode}
                  </span>
                </DocketRow>
                <DocketRow label="Bergabung" icon={Calendar}>
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-polks-text-soft">
                    {formatJoined(p.createdAt)}
                  </span>
                </DocketRow>
              </div>

              {editing ? (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="mt-4 w-full rounded-xl bg-polks-brand py-3 text-[12px] font-bold text-white disabled:opacity-60"
                >
                  {saving ? "Menyimpan…" : "Simpan Perubahan"}
                </button>
              ) : null}
            </div>

            {!editing && p.pendingEmail ? (
              <div className="mt-3 rounded-2xl border border-dashed border-polks-border bg-polks-card p-4">
                <p className="text-[12px] leading-relaxed text-polks-text-soft">
                  Perubahan email ke <b>{p.pendingEmail}</b> menunggu konfirmasi — cek inbox.
                </p>
                <div className="mt-2 flex gap-4">
                  <button
                    type="button"
                    disabled={pendingBusy}
                    onClick={resendPending}
                    className="text-[11px] font-bold text-polks-text underline decoration-polks-point decoration-2 underline-offset-2 disabled:opacity-60"
                  >
                    Kirim ulang
                  </button>
                  <button
                    type="button"
                    disabled={pendingBusy}
                    onClick={cancelPending}
                    className="text-[11px] font-bold text-polks-muted underline underline-offset-2 disabled:opacity-60"
                  >
                    Batalkan
                  </button>
                </div>
              </div>
            ) : null}

            {!editing && !p.pendingEmail && !p.emailVerified ? (
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-amber-800">Email belum diverifikasi</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                    Verifikasi email untuk mengamankan akun kamu.
                  </p>
                  <button
                    type="button"
                    disabled={sendingVerif || verifSent}
                    onClick={async () => {
                      setSendingVerif(true);
                      try {
                        await api("/auth/verify-email/send", { method: "POST" });
                        setVerifSent(true);
                      } catch {
                        // best-effort
                      } finally {
                        setSendingVerif(false);
                      }
                    }}
                    className="mt-2 text-[12px] font-bold text-amber-800 underline underline-offset-2 disabled:opacity-60"
                  >
                    {verifSent ? "Email terkirim — cek inbox kamu" : sendingVerif ? "Mengirim…" : "Kirim email verifikasi"}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </CustomerShell>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors. (If `IdCard`, `Calendar`, or `User` show as unused-import errors, double check every icon used in `DocketRow` calls above is imported — they should all be, but re-scan the JSX against the `import { ... } from "lucide-react"` line if the check fails.)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/profile/account/page.tsx
git commit -m "feat(profile): redesign Informasi Akun as an editable 'Docket' card"
```

---

### Task 8: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend test suite**

```bash
cd backend && npm test
```

Expected: all suites pass, including the new/modified `auth.service.spec.ts` and `member.service.spec.ts`.

- [ ] **Step 2: Start both dev servers**

```bash
cd backend && npm run start:dev
```
```bash
cd frontend && npm run dev
```

- [ ] **Step 3: Verify name & phone edit (direct, no confirmation)**

In the browser: log in as a customer with a password-based account → go to Profil → Informasi Akun → tap **Edit** → change Nama and No. HP → **Simpan Perubahan**. Confirm: values update immediately in the Docket, no page reload needed, "Edit" link reappears.

- [ ] **Step 4: Verify email change (confirmation flow)**

Same account → **Edit** → change Email → **Simpan Perubahan**. Confirm: a dashed-border banner appears below the card ("Perubahan email ke ... menunggu konfirmasi"). Check the backend terminal log (`[DEV MAIL] to=... subject="Konfirmasi perubahan email POLKS"`) for the confirmation link, copy it into the browser. Confirm: lands on `/auth/confirm-email-change`, shows success, and going back to Informasi Akun now shows the new email with no pending banner.

- [ ] **Step 5: Verify "Kirim ulang" / "Batalkan" on the pending banner**

Trigger another email change, then click **Batalkan** on the banner — confirm it disappears and the email row still shows the old (unchanged) email. Trigger again, click **Kirim ulang** — confirm a second email appears in the backend dev log.

- [ ] **Step 6: Verify a Google-only account is blocked**

Log in with a Google-only account (no password) → Informasi Akun → **Edit**. Confirm the Email field is disabled with the "Akun Google, tidak bisa diubah" note, and only Nama/No. HP are editable.

- [ ] **Step 7: Verify the tier stamp across tiers**

If accounts at different tiers are available (bronze/silver/gold/platinum), check each renders the stamp badge with the matching `TIER_META` color and correct label. If not all tiers are available in dev data, at minimum confirm the current account's tier renders correctly and the stamp doesn't visually break (rotation, text fit) at both a short label ("Gold") and the longest label ("Platinum").

- [ ] **Step 8: Verify mobile viewport & existing email-verification banner**

Confirm the whole page (view mode, edit mode, both banners) looks correct at the `polks-phone` mobile width (this project's mobile-first max-width, 430px) — no overflow or text wrapping breakage. For an account with an unverified current email (no pending change), confirm the amber "Email belum diverifikasi" banner still appears and its "Kirim email verifikasi" button still works (this was silently broken before Task 5 fixed the missing `emailVerified` field — confirm it's now live).

- [ ] **Step 9: Report results**

Summarize: which steps passed, any visual deviations from the spec worth flagging back for a follow-up tweak, and whether all Jest suites are green.
