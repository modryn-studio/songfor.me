import type { Metadata } from 'next';
import { site } from '@/config/site';
import CreateContent from './page-content';

export const metadata: Metadata = {
  title: `Make Their Personalized Birthday Song — ${site.name}`,
  description:
    "Tell us who they are — their name, their quirks, their inside jokes. We'll write a one-of-a-kind birthday song just for them in minutes.",
  openGraph: {
    title: `Make Their Personalized Birthday Song — ${site.name}`,
    description:
      "Tell us who they are — their name, their quirks, their inside jokes. We'll write a one-of-a-kind birthday song just for them in minutes.",
    url: `${site.url}/create`,
    siteName: site.name,
  },
};

export default function CreatePage() {
  return <CreateContent />;
}
