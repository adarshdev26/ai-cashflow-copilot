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
            ].join('\n'),
        );
        return;
    }

    console.log(`Password reset requested for ${input.to}`);
    // TODO: configure a real email provider
}

type TicketEmailBase = {
    to: string;
    name?: string | null;
    ticketId: string;
    subject: string;
};

export async function sendTicketCreatedEmail(
    input: TicketEmailBase & { message: string },
): Promise<void> {
    // Replace the body with your provider call when you add one.
    console.info(`[email] ticket created -> ${input.to} #${input.ticketId} "${input.subject}"`);
}

export async function sendTicketStatusEmail(
    input: TicketEmailBase & { status: 'PROCESSING' | 'RESOLVED' },
): Promise<void> {
    console.info(
        `[email] ticket ${input.status} -> ${input.to} #${input.ticketId} "${input.subject}"`,
    );
}
