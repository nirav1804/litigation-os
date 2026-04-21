import { Global, Module } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { AuditService } from './services/audit.service';
import { RemindersService } from './services/reminders.service';

@Global()
@Module({
  providers: [MailService, AuditService, RemindersService],
  exports: [MailService, AuditService],
})
export class CommonModule {}
