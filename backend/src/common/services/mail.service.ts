import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private from: string;

  constructor(private config: ConfigService) {
    this.from = config.get('EMAIL_FROM', 'Litigation OS <noreply@litigationos.in>');

    const host = config.get('SMTP_HOST');
    const port = config.get<number>('SMTP_PORT', 587);
    const user = config.get('SMTP_USER');
    const pass = config.get('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      this.logger.log(`Mail service configured: ${host}:${port}`);
    } else {
      // Development: log emails to console instead of sending
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.logger.warn('SMTP not configured — emails will be logged to console only');
    }
  }

  async sendPasswordReset(email: string, token: string, firstName: string): Promise<void> {
    const appUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await this.send({
      to: email,
      subject: 'Reset your Litigation OS password',
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e3a5f; margin-bottom: 8px;">Password Reset Request</h2>
          <p style="color: #64748b;">Hi ${firstName},</p>
          <p style="color: #64748b;">You requested a password reset for your Litigation OS account. Click the button below to reset it. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#94a3b8;font-size:13px;margin-top:24px;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
          <p style="color:#94a3b8;font-size:12px;">Or copy this link: ${resetUrl}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
          <p style="color:#94a3b8;font-size:12px;">Litigation OS — Indian Legal Practice Management</p>
        </div>
      `,
    });
  }

  async sendWelcome(email: string, firstName: string, orgName: string): Promise<void> {
    const appUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');

    await this.send({
      to: email,
      subject: `Welcome to Litigation OS — ${orgName}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e3a5f;">Welcome to Litigation OS ⚖️</h2>
          <p style="color: #64748b;">Hi ${firstName},</p>
          <p style="color: #64748b;">Your account has been created for <strong>${orgName}</strong>. You can now log in and start managing your litigation matters.</p>
          <a href="${appUrl}/auth/login" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Go to Dashboard
          </a>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
          <p style="color:#94a3b8;font-size:12px;">Litigation OS — Indian Legal Practice Management</p>
        </div>
      `,
    });
  }

  async sendHearingReminder(
    email: string,
    firstName: string,
    matterTitle: string,
    hearingDate: Date,
    caseNumber: string,
  ): Promise<void> {
    const formattedDate = hearingDate.toLocaleString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    await this.send({
      to: email,
      subject: `⚖️ Hearing Tomorrow: ${matterTitle}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e3a5f;">Hearing Reminder</h2>
          <p style="color: #64748b;">Hi ${firstName}, you have a hearing scheduled for tomorrow.</p>
          <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 8px;font-weight:600;color:#1e293b;">${matterTitle}</p>
            <p style="margin:0 0 4px;color:#64748b;font-size:14px;">📁 ${caseNumber || 'No case number'}</p>
            <p style="margin:0;color:#1d4ed8;font-size:14px;font-weight:500;">📅 ${formattedDate}</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;">This is an automated reminder from Litigation OS.</p>
        </div>
      `,
    });
  }

  async sendTaskDeadlineAlert(
    email: string,
    firstName: string,
    taskTitle: string,
    matterTitle: string,
    dueDate: Date,
  ): Promise<void> {
    await this.send({
      to: email,
      subject: `⚠️ Task Due Tomorrow: ${taskTitle}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #dc2626;">Task Due Tomorrow</h2>
          <p style="color: #64748b;">Hi ${firstName},</p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 8px;font-weight:600;color:#1e293b;">${taskTitle}</p>
            <p style="margin:0 0 4px;color:#64748b;font-size:14px;">Matter: ${matterTitle}</p>
            <p style="margin:0;color:#dc2626;font-size:14px;font-weight:500;">
              Due: ${dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <p style="color:#94a3b8;font-size:12px;">Log in to Litigation OS to update this task.</p>
        </div>
      `,
    });
  }

  private async send(options: { to: string; subject: string; html: string }): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        ...options,
      });

      // In development with jsonTransport, log the email
      if ((info as any).message) {
        this.logger.debug(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
        this.logger.debug((info as any).message);
      }
    } catch (error) {
      // Never throw — email failure should not break main flows
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
    }
  }
}
