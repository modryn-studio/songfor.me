import type { Metadata } from 'next';
import { site } from '@/config/site';
import AdminContent from './page-content';

export const metadata: Metadata = {
  title: `Admin — ${site.name}`,
  description: 'Admin dashboard for managing songfor.me orders and song delivery.',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminContent />;
}
