type PasswordResetEmail = {
  to: string;
  name?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
};

export async function sendPasswordResetEmail(input: PasswordResetEmail): Promise<void> {
  // TODO: swap for Resend / SES / SMTP later. Keep this signature.
  console.log(
    [
      '',
      '──────── PASSWORD RESET (dev stub, no email sent) ────────',
      `To:      ${input.to}`,
      `Name:    ${input.name ?? '-'}`,
      `Link:    ${input.resetUrl}`,
      `Expires: ${input.expiresInMinutes} minutes`,
      '───────────────────────────────────────────────────────────',
      '',
    ].join('\n')
  );
}