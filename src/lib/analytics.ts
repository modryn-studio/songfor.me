// analytics.ts — event tracking abstraction (Vercel Analytics)
// Add a named method for each distinct user action — keeps events typed
// and discoverable instead of magic strings scattered across the codebase.

type EventProps = Record<string, string | number | boolean | undefined>;

// Vercel Analytics pageviews are handled automatically by <Analytics /> in layout.tsx.
// Named methods here are for custom events — no-op stubs until a custom event SDK is added.
function track(_eventName: string, _props?: EventProps): void {
  // placeholder — wire up a custom event SDK here if needed
}

// Add project-specific named methods below.
// Pattern: namedAction: (props: { ... }) => track('event_name', props)
export const analytics = {
  track,
  newsletterSignup: (props?: { source?: string }) => track('newsletter_signup', props),
  feedbackSubmit: () => track('feedback_submit'),
};
