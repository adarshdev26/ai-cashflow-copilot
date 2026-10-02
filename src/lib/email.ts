type PasswordResetEmail = {
  to: string;
  name?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
};

export async function sendPasswordResetEmail(input: PasswordResetEmail): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    // TODO: swap for Resend / SES / SMTP later. Keep this signature.
    console.log(
      [
        '',
        '──────── PASSWORD RESET (dev stub, no email sent) ────────',
        `To:      ${input.to}`,
        `Name:    ${input.name ?? '-'}`,
        `Link:    ${input.resetUrl}`,
        `Expires: ${input.expiresInMinutes} minutes`,
        '────────────────────────────────────────────────────────',
        '',
      ].join('\n')
    );
    return;
  }

  console.log(`Password reset requested for ${input.to}`);
  // TODO: configure a real email provider
}
