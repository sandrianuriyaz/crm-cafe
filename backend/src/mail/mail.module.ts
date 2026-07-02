import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

// Global supaya bisa di-inject di modul mana pun tanpa import berulang.
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
