// analytics.ts — event tracking abstraction (GA4 + PostHog)
// Never call gtag() or posthog.capture() directly outside this file.
// Add a named method for each distinct user action — keeps events typed
// and discoverable instead of magic strings scattered across the codebase.

import posthog from 'posthog-js';

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
  }
}

type EventProps = Record<string, string | number | boolean | undefined>;

function track(eventName: string, props?: EventProps): void {
  // SSR guard — both gtag and posthog are browser-only
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, props);
  }
  posthog.capture(eventName, props);
}

// Add project-specific named methods below.
// Pattern: namedAction: (props: { ... }) => track('event_name', props)
export const analytics = {
  track,
  newsletterSignup: (props?: { source?: string }) => track('newsletter_signup', props),
  feedbackSubmit: () => track('feedback_submit'),
};
