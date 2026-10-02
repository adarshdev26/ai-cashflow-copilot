import { RevealObserver } from '@/components/marketing/RevealObserver';
import { MarketingNavbar } from '@/content/marketing/layout/MarketingNavbar';
import { MarketingFooter } from '@/content/marketing/layout/MarketingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="marketing flex min-h-screen flex-col bg-mk-bg text-mk-fg">
        <MarketingNavbar />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
      <RevealObserver />
    </>
  );
}