const wrapper = (title: string, bodyHtml: string, ctaUrl: string, ctaLabel: string) => `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #171717;">
  <div style="font-size: 20px; font-weight: 700; margin-bottom: 24px; color: #4c1d95;">PayTrack</div>
  <h1 style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">${title}</h1>
  <div style="font-size: 14px; line-height: 1.6; color: #52525b;">${bodyHtml}</div>
  <a href="${ctaUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4c1d95; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">${ctaLabel}</a>
  <p style="margin-top: 24px; font-size: 12px; color: #a1a1aa;">If the button doesn't work, copy this link:<br/>${ctaUrl}</p>
</div>
`;

export function verificationEmail(url: string) {
  return wrapper(
    "Verify your email",
    "Confirm your email address to finish setting up your PayTrack account.",
    url,
    "Verify email",
  );
}

export function resetPasswordEmail(url: string) {
  return wrapper(
    "Reset your password",
    "We received a request to reset your PayTrack password. This link expires in 1 hour. If you didn't request this, you can ignore this email.",
    url,
    "Reset password",
  );
}
