import { redirect } from 'next/navigation';
import { getValidUser } from '@/lib/session-guard';

export default async function Home() {
  const user = await getValidUser();
  redirect(user ? '/dashboard' : '/api/auth/invalid');
}
