// Promo banner — shown on the landing page when PROMO_CODE and PROMO_LABEL are set.
// To launch: set both env vars in Vercel and redeploy.
// To kill: clear both env vars (or just PROMO_CODE) and redeploy.
// The Stripe coupon should also be archived in the Stripe dashboard to stop accepting codes.
export function PromoBanner() {
  const code = process.env.PROMO_CODE;
  const label = process.env.PROMO_LABEL;
  if (!code || !label) return null;

  return (
    <div className="bg-secondary/20 border-secondary/40 border-b px-4 py-2.5 text-center text-sm font-medium">
      <span className="text-text">{label} — use code </span>
      <span className="bg-secondary/40 border-secondary/60 text-text inline-block rounded-md border px-2 py-0.5 font-mono text-xs font-semibold tracking-wider">
        {code}
      </span>
      <span className="text-text"> at checkout</span>
    </div>
  );
}
