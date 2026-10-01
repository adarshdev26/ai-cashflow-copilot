import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing/sections/LegalLayout';

export const metadata: Metadata = { title: 'Terms of Service', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="TODO date">
      <h2>1. Using the service</h2>
      <p>You are responsible for your account and for the content you add. TODO.</p>
      <h2>2. Workspaces and members</h2>
      <p>Workspace owners manage members and invitations. TODO.</p>
      <h2>3. Acceptable use</h2>
      <p>No unlawful or abusive use of the service. TODO.</p>
      <h2>4. Disclaimer</h2>
      <p>The service helps you track your finances and is not financial, tax or legal advice.</p>
      <h2>5. Changes</h2>
      <p>We may update these terms and will note the date above.</p>
    </LegalLayout>
  );
}