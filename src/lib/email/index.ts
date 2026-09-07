import nodemailer from "nodemailer";
import { env } from "@/lib/env";

const port = Number(env.SMTP_PORT) || 587;
const secure = env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465;

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    })
  : null;

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Central email send point — nothing else in the app should call nodemailer
 * directly. Falls back to a console log when SMTP_HOST isn't configured yet,
 * so auth flows (verification, password reset) stay testable locally before
 * real credentials are wired up.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!transporter) {
    console.warn(
      `[email:stub] SMTP_HOST not set — would send "${subject}" to ${to}\n${html}`,
    );
    return;
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
}
