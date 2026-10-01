import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing/sections/LegalLayout';

export const metadata: Metadata = { title: 'Privacy Policy', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="TODO date">
      <h2>1. Information we collect</h2>
      <p>Account details, the transactions, habits and notes you add, and basic usage data. TODO: list exactly.</p>
      <h2>2. How we use it</h2>
      <p>To run the service, keep it secure and contact you about your account. TODO.</p>
      <h2>3. Sharing within workspaces</h2>
      <p>Data in a workspace is visible to its members. Members join by invitation.</p>
      <h2>4. Your choices</h2>
      <p>Describe export, deletion and contact options. TODO.</p>
      <h2>5. Contact</h2>
      <p>Questions? Use the contact page.</p>
    </LegalLayout>
  );
}