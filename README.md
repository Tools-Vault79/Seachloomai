# SeachLoom AI V2.5

Dynamic SaaS-oriented SEO + AI Search Visibility MVP.

## Included
- Redesigned Teal + Amber interface
- 15 focused tool modules
- Preview-first / protected-result UX
- Payment-ready paywall flow (provider integration still required)
- Tutorials / learning section
- Write for Us editorial submission form
- Editorial email: aziz_zishan@yahoo.com
- LinkedIn: https://www.linkedin.com/in/zishan-aziz-optimizing-resources-building-strong-teams/
- Cloudflare Worker API foundation
- D1-ready schema for users, projects, tool runs, credits and submissions

## Important
The payment button in this MVP is a placeholder. A real payment provider, webhook verification, authentication and D1 persistence must be connected before production.

## Run
npm install
npx wrangler dev

## Deploy
npx wrangler deploy

\n## V2.2 additions
- 15 dedicated, integrated tool pages under `public/tools/`
- Every tool page uses the same SeachLoom navigation, visual system and protected-result flow.
- Homepage tool cards link to the dedicated pages.
- Free-account positioning is included in the UX.
- Write for Us remains integrated with the editorial contact information supplied by the owner.
- The tool pages are preview/paywall ready; real authentication, D1 persistence and payment provider/webhook verification remain production integration tasks.


## V2.5 branding correction and preservation updates
- Brand spelling standardized to **SeachLoom AI** throughout the website UI, metadata, tool pages, footer copy, preview messages and Worker service label. The registered domain is **https://seachloomai.shop/**.
- Correct website domain used in canonical and Open Graph URLs: **https://seachloomai.shop/**
- Existing paywall / protected-result logic was intentionally left unchanged.
- Tool cards now have reversible hover animations: lift, border/background accent, icon animation and text/button color changes that return to the original state when the pointer leaves.
- Optional advertising inventory has been added without forcing ads into the current design.

### Advertising placement inventory
All advertising slots are **hidden by default**. This keeps the current site clean until a paid banner is supplied.

| Slot | Recommended size | Placement |
|---|---:|---|
| `top-banner` | 970 × 90 px desktop; 320 × 100 px mobile | Below the main navigation |
| `left-rail` | 160 × 600 px | Fixed left side on wide desktop screens |
| `right-rail` | 160 × 600 px | Fixed right side on wide desktop screens |

### How to activate an ad slot
Each slot has a `data-ad-slot` identifier. Remove the `hidden` attribute and place the advertiser's image/link or HTML inside `.ad-slot-content`. The close button lets a visitor remove the banner from view.

Suggested future commercial inventory:
- Homepage top banner
- Homepage left/right desktop rails
- Tool-page top banner
- Tool-page left/right desktop rails

The ad system is deliberately independent of the protected-result/paywall flow.


## Gumroad lifetime-access integration
- 15 supplied Gumroad checkout URLs are mapped in `public/config/gumroad-products.js`.
- Tool pages load `public/gumroad-paywall.js`.
- License verification is proxied through `/api/gumroad/verify` in `worker.js`.
- License checks use `increment_uses_count=false` for repeat lifetime access.
- See `GUMROAD_SETUP.md` for required Gumroad product configuration.
