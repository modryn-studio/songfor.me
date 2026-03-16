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
    "Tell us about them — their name, their quirks, their inside jokes. We'll craft a personalized birthday song and deliver it to your inbox. $9.99.",
  cta: 'Start their song for $9.99 →',
  founder: 'Luke Hanner',
  email: 'hello@modrynstudio.com',
  waitlist: {
    headline: 'Know someone with a birthday coming up?',
    subheadline:
      'Give them the gift no one else will — a song made just for them, delivered to your inbox.',
    success: "We'll be in touch. In the meantime, start their song now.",
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
