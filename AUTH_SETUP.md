# SeachLoomAI Authentication & Lifetime Access

This build adds:
- Email/password signup and login
- Secure HttpOnly session cookie
- PBKDF2 password hashing (120,000 iterations, SHA-256)
- Customer dashboard
- Per-tool lifetime entitlements
- Gumroad license verification and activation
- No credits and no recurring subscription
- One account can own multiple tools

## Cloudflare D1 setup

1. Create a D1 database, e.g. `seachloom-ai`.
2. Add a D1 binding named `DB` to `wrangler.jsonc` using the real database ID.
3. Apply `schema.sql`:
   `npx wrangler d1 execute seachloom-ai --remote --file=./schema.sql`
4. Deploy:
   `npx wrangler deploy`

Do not put Gumroad secrets or passwords in frontend JavaScript.

## Customer flow

Sign up/login -> Buy on Gumroad -> return to SeachLoomAI -> enter Gumroad license key once -> Gumroad verifies -> entitlement is stored against the account -> future visits use the account session and lifetime entitlement.

The current tool endpoints remain the existing preview implementation. The access-control layer is ready, but a real AI provider/API must still be connected to generate production AI results.
