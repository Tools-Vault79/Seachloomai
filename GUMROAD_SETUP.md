# SeachLoomAI — Gumroad Checkout + Lifetime Access

## Included
- 15 Gumroad checkout links mapped from the supplied Excel file.
- Buy buttons on the homepage.
- Gumroad paywall on all 15 tool pages.
- One-time/lifetime access UX; no credits and no subscription.
- Gumroad license-key verification through the Cloudflare Worker.
- D1 entitlement table prepared for future persistence.

## Gumroad setup required
For each of the 15 products, enable Gumroad license keys in the product settings. The customer can then use the key from the Gumroad receipt to activate lifetime access in SeachLoomAI.

The verifier uses `POST https://api.gumroad.com/v2/licenses/verify` and sets `increment_uses_count=false`, so normal repeat access does not consume license uses.

## Deploy
```bash
npm install
npx wrangler deploy
```

## Important
The supplied website package's `/api/tool/preview` endpoint is still a placeholder that returns a preview response. This integration adds the purchase gate; it does not invent the underlying AI analysis engines.

## Gumroad policy
Gumroad's current prohibited-products page says AI services include selling access to AI tools/services fulfilled outside Gumroad. SeachLoomAI is externally hosted, so review that policy and obtain Gumroad confirmation before using these links for hosted AI-tool access.
