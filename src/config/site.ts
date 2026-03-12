// Single source of truth for all site-wide metadata.
// /init fills this in from context.md + brand.md.
// Every other file imports from here — never hardcode site metadata elsewhere.
export const site = {
  name: 'songfor.me',
  shortName: 'songfor.me',
  url: 'https://songfor.gift',
  description:
    "Make a personalized birthday song in minutes. Tell us their quirks, inside jokes, and vibe — we'll deliver a one-of-a-kind song they'll never forget.",
  ogTitle: "songfor.me — A Birthday Song They'll Never Forget",
  ogDescription:
    "Tell us about them — their name, their quirks, their inside jokes. We'll craft a personalized birthday song and deliver it in minutes. $9.99.",
  cta: 'Start their song for $9.99 →',
  founder: 'Luke Hanner',
  email: 'hello@songfor.gift',
  waitlist: {
    headline: 'Get first access.',
    subheadline:
      "songfor.me is in prelaunch. Join the list and you'll get first access the moment we open, plus early-bird pricing.",
    success: "You're in. We'll email you as soon as first access opens.",
  },
  accent: '#FF6B6B',
  bg: '#FFFAF5',
  social: {
    twitter: 'https://x.com/lukehanner',
    twitterHandle: '@lukehanner',
    github: 'https://github.com/modryn-studio/songfor.me',
    devto: 'https://dev.to/lukehanner',
    shipordie: 'https://shipordie.club/lukehanner',
  },
} as const;
