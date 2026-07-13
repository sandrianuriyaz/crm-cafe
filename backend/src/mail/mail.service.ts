import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Layanan email transaksional. Bila SMTP_HOST diisi → kirim via SMTP asli.
// Bila kosong → mode dev: email hanya di-log (tautan reset/verifikasi tetap
// terlihat di console sehingga alur bisa diuji tanpa server email).
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn(
        'SMTP_HOST tidak diset — email hanya di-log ke console (mode dev).',
      );
      return;
    }

    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('SMTP_PORT') ?? 587,
      secure: this.config.get<boolean>('SMTP_SECURE') ?? false,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  private get from(): string {
    return this.config.get<string>('MAIL_FROM') ?? 'POLKS <no-reply@polks.id>';
  }

  async send(to: string, subject: string, html: string, text?: string) {
    if (!this.transporter) {
      // Mode dev: tampilkan isi email di log supaya alur tetap bisa diuji.
      this.logger.log(
        `[DEV MAIL] to=${to} subject="${subject}"\n${text ?? html}`,
      );
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text,
      });
    } catch (err) {
      // Best-effort: kegagalan kirim email tidak boleh menggagalkan request
      // (mis. forgot-password harus tetap balas 200 demi keamanan).
      this.logger.error(`Gagal mengirim email ke ${to}: ${String(err)}`);
    }
  }

  // ── Template ──────────────────────────────────────────────────────────────

  async sendPasswordReset(to: string, name: string, resetUrl: string) {
    const subject = 'Reset kata sandi akun POLKS';
    const text =
      `Halo ${name},\n\n` +
      `Kami menerima permintaan reset kata sandi. Buka tautan berikut untuk membuat kata sandi baru:\n` +
      `${resetUrl}\n\n` +
      `Tautan berlaku 1 jam. Abaikan email ini bila kamu tidak meminta reset.`;
    const html = this.layout(
      `Halo <b>${name}</b>,`,
      `Kami menerima permintaan reset kata sandi akunmu. Klik tombol di bawah untuk membuat kata sandi baru. Tautan berlaku <b>1 jam</b>.`,
      'Reset Kata Sandi',
      resetUrl,
      'Abaikan email ini bila kamu tidak meminta reset kata sandi.',
    );
    await this.send(to, subject, html, text);
  }

  async sendEmailVerification(to: string, name: string, verifyUrl: string) {
    const subject = 'Verifikasi email akun POLKS';
    const text =
      `Halo ${name},\n\n` +
      `Verifikasi alamat email kamu dengan membuka tautan berikut:\n` +
      `${verifyUrl}\n\n` +
      `Tautan berlaku 24 jam.`;
    const html = this.layout(
      `Halo <b>${name}</b>,`,
      `Terima kasih sudah bergabung. Verifikasi alamat emailmu dengan menekan tombol di bawah. Tautan berlaku <b>24 jam</b>.`,
      'Verifikasi Email',
      verifyUrl,
      'Abaikan email ini bila kamu tidak membuat akun POLKS.',
    );
    await this.send(to, subject, html, text);
  }

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

  private layout(
    greeting: string,
    body: string,
    ctaLabel: string,
    ctaUrl: string,
    footer: string,
  ): string {
    return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
  <h2 style="margin:0 0 16px">POLKS</h2>
  <p>${greeting}</p>
  <p>${body}</p>
  <p style="margin:24px 0">
    <a href="${ctaUrl}" style="background:#111827;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">${ctaLabel}</a>
  </p>
  <p style="font-size:12px;color:#6b7280;word-break:break-all">Atau salin tautan ini ke browser:<br>${ctaUrl}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:12px;color:#9ca3af">${footer}</p>
</div>`;
  }
}
