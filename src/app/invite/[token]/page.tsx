import { InviteLanding } from '@/features/invitations/components/InviteLanding';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    return <InviteLanding token={token} />;
}
