export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  try {
    const { ensureSeededAdmin } = await import('@/lib/admin/seed');
    await ensureSeededAdmin();
  } catch (e) {
    console.error('[admin-seed] failed', e);
  }
}
