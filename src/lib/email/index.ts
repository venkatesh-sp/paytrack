import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Central email send point — nothing else in the app should call Resend
 * directly. Falls back to a console log when RESEND_API_KEY isn't configured
 * yet, so auth flows (verification, password reset) stay testable locally
 * before real credentials are wired up.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!resend) {
    console.log(
      `[email:stub] RESEND_API_KEY not set — would send "${subject}" to ${to}\n${html}`,
    );
    return;
  }

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });
}
