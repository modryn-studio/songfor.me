import { SiteSchema } from '@/components/site-schema';
import { SiteFooter } from '@/components/site-footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteSchema />
      {children}
      <SiteFooter />
    </>
  );
}
