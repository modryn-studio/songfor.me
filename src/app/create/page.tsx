import { redirect } from 'next/navigation';

// /create is being built — redirect to the waitlist for now.
export default function CreatePage() {
  redirect('/#signup');
}
