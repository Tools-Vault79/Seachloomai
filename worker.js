const TOOL_SLUGS = new Set([
  "ai-content-optimizer",
  "keyword-researcher",
  "keyword-clusterer",
  "search-intent",
  "keyword-opportunity",
  "seo-brief",
  "content-gap",
  "content-outline",
  "onpage-audit",
  "meta-generator",
  "internal-links",
  "schema-generator",
  "ai-visibility",
  "ai-citations",
  "geo-optimizer"
]);

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers
    }
  });
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Lax`;
}

function getCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(
    new RegExp(
      "(?:^|;\\s*)" +
        name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        "=([^;]*)"
    )
  );

  return m ? decodeURIComponent(m[1]) : "";
}

function b64u(bytes) {
  let s = "";

  for (const b of bytes) {
    s += String.fromCharCode(b);
  }

  return btoa(s)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function hex(bytes) {
  return [...bytes]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomId() {
  return crypto.randomUUID();
}

async function digestHex(text) {
  const b = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );

  return hex(new Uint8Array(b));
}

async function hashPassword(password) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    key,
    256
  );

  return `pbkdf2$100000$${b64u(salt)}$${b64u(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  try {
    const [, it, saltB64, hashB64] = stored.split("$");

    const salt = Uint8Array.from(
      atob(
        saltB64.replace(/-/g, "+").replace(/_/g, "/") +
          "=".repeat((4 - (saltB64.length % 4)) % 4)
      ),
      c => c.charCodeAt(0)
    );

    const expected = Uint8Array.from(
      atob(
        hashB64.replace(/-/g, "+").replace(/_/g, "/") +
          "=".repeat((4 - (hashB64.length % 4)) % 4)
      ),
      c => c.charCodeAt(0)
    );

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const bits = new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt,
          iterations: Number(it),
          hash: "SHA-256"
        },
        key,
        256
      )
    );

    if (bits.length !== expected.length) {
      return false;
    }

    let x = 0;

    for (let i = 0; i < bits.length; i++) {
      x |= bits[i] ^ expected[i];
    }

    return x === 0;
  } catch (_) {
    return false;
  }
}

async function sessionForUser(env, userId) {
  const raw = b64u(
    crypto.getRandomValues(new Uint8Array(32))
  );

  const tokenHash = await digestHex(raw);

  await env.DB
    .prepare(
      "INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,datetime('now','+30 days'))"
    )
    .bind(
      randomId(),
      userId,
      tokenHash
    )
    .run();

  return raw;
}

async function currentUser(request, env) {
  if (!env.DB) {
    return null;
  }

  const raw = getCookie(
    request,
    "__Host-seachloom_session"
  );

  if (!raw) {
    return null;
  }

  const h = await digestHex(raw);

  const r = await env.DB
    .prepare(
      "SELECT u.id,u.email,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>datetime('now')"
    )
    .bind(h)
    .first();

  return r || null;
}

async function requireUser(request, env) {
  const u = await currentUser(request, env);

  if (!u) {
    throw new Error("Please log in to continue.");
  }

  return u;
}

function dbMissing(env) {
  return !env.DB;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {

      /*
       * HEALTH CHECK
       */
      if (url.pathname === "/api/health") {
        return json({
          ok: true,
          service: "SeachLoom AI",
          version: "4.0-auth-gumroad",
          database: !!env.DB
        });
      }


      /*
       * TOOLS
       */
      if (url.pathname === "/api/tools") {
        return json({
          tools: [
            ["ai-content-optimizer", "AI Content Optimizer"],
            ["keyword-researcher", "Keyword Researcher"],
            ["keyword-clusterer", "Keyword Clustering"],
            ["search-intent", "Search Intent Analyzer"],
            ["keyword-opportunity", "Keyword Opportunity Finder"],
            ["seo-brief", "SEO Brief Builder"],
            ["content-gap", "Content Gap Analyzer"],
            ["content-outline", "Content Outline Generator"],
            ["onpage-audit", "On-Page SEO Audit"],
            ["meta-generator", "Meta Generator"],
            ["internal-links", "Internal Link Suggestions"],
            ["schema-generator", "Schema Generator"],
            ["ai-visibility", "AI Search Visibility Tracker"],
            ["ai-citations", "AI Citation Analyzer"],
            ["geo-optimizer", "AI Search Content Optimizer"]
          ]
        });
      }


      /*
       * SIGN UP
       */
      if (
        url.pathname === "/api/auth/signup" &&
        request.method === "POST"
      ) {
        if (dbMissing(env)) {
          return json(
            {
              ok: false,
              message:
                "Authentication database is not configured yet."
            },
            503
          );
        }

        const b = await request.json();

        const name = String(b.name || "").trim();
        const email = String(b.email || "")
          .trim()
          .toLowerCase();

        const password = String(b.password || "");

        if (!name || !email || !password) {
          return json(
            {
              ok: false,
              message:
                "Name, email and password are required."
            },
            400
          );
        }

        if (password.length < 8) {
          return json(
            {
              ok: false,
              message:
                "Password must be at least 8 characters."
            },
            400
          );
        }

        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
          return json(
            {
              ok: false,
              message:
                "Please enter a valid email address."
            },
            400
          );
        }

        const exists = await env.DB
          .prepare(
            "SELECT id FROM users WHERE email=?"
          )
          .bind(email)
          .first();

        if (exists) {
          return json(
            {
              ok: false,
              message:
                "An account with this email already exists. Please log in."
            },
            409
          );
        }

        const id = randomId();

        const ph = await hashPassword(password);

        await env.DB
          .prepare(
            "INSERT INTO users(id,email,name,password_hash) VALUES(?,?,?,?)"
          )
          .bind(
            id,
            email,
            name,
            ph
          )
          .run();

        const token = await sessionForUser(
          env,
          id
        );

        /*
         * FIXED:
         * json(data, status, headers)
         */
        return json(
          {
            ok: true,
            message:
              "Account created successfully.",
            user: {
              id,
              email,
              name
            }
          },
          200,
          {
            "Set-Cookie": cookie(
              "__Host-seachloom_session",
              token,
              2592000
            )
          }
        );
      }


      /*
       * LOGIN
       */
      if (
        url.pathname === "/api/auth/login" &&
        request.method === "POST"
      ) {
        if (dbMissing(env)) {
          return json(
            {
              ok: false,
              message:
                "Authentication database is not configured yet."
            },
            503
          );
        }

        const b = await request.json();

        const email = String(b.email || "")
          .trim()
          .toLowerCase();

        const password = String(
          b.password || ""
        );

        const u = await env.DB
          .prepare(
            "SELECT id,email,name,password_hash FROM users WHERE email=?"
          )
          .bind(email)
          .first();

        if (
          !u ||
          !(await verifyPassword(
            password,
            u.password_hash
          ))
        ) {
          return json(
            {
              ok: false,
              message:
                "Invalid email or password."
            },
            401
          );
        }

        const token =
          await sessionForUser(env, u.id);

        /*
         * FIXED:
         * json(data, status, headers)
         */
        return json(
          {
            ok: true,
            message:
              "Logged in successfully.",
            user: {
              id: u.id,
              email: u.email,
              name: u.name
            }
          },
          200,
          {
            "Set-Cookie": cookie(
              "__Host-seachloom_session",
              token,
              2592000
            )
          }
        );
      }


      /*
       * LOGOUT
       */
      if (
        url.pathname === "/api/auth/logout" &&
        request.method === "POST"
      ) {
        if (env.DB) {
          const raw = getCookie(
            request,
            "__Host-seachloom_session"
          );

          if (raw) {
            await env.DB
              .prepare(
                "DELETE FROM sessions WHERE token_hash=?"
              )
              .bind(
                await digestHex(raw)
              )
              .run();
          }
        }

        /*
         * FIXED:
         * json(data, status, headers)
         */
        return json(
          {
            ok: true,
            message: "Logged out."
          },
          200,
          {
            "Set-Cookie": cookie(
              "__Host-seachloom_session",
              "",
              0
            )
          }
        );
      }


      /*
       * CURRENT USER / SESSION
       */
      if (
        url.pathname === "/api/auth/me" &&
        request.method === "GET"
      ) {
        const u =
          await currentUser(request, env);

        return json(
          u
            ? {
                authenticated: true,
                user: u
              }
            : {
                authenticated: false
              }
        );
      }


      /*
       * ENTITLEMENTS
       */
      if (
        url.pathname ===
          "/api/auth/entitlements" &&
        request.method === "GET"
      ) {
        if (dbMissing(env)) {
          return json(
            {
              ok: false,
              active: false,
              message:
                "Database not configured."
            },
            503
          );
        }

        const u =
          await currentUser(request, env);

        if (!u) {
          return json(
            {
              ok: false,
              active: false,
              message: "Login required."
            },
            401
          );
        }

        const tool = String(
          url.searchParams.get("tool") || ""
        ).trim();

        const e = await env.DB
          .prepare(
            "SELECT tool_slug,product_permalink,status,access_type FROM entitlements WHERE lower(email)=lower(?) AND product_permalink=? AND status='active'"
          )
          .bind(
            u.email,
            tool
          )
          .first();

        return json({
          ok: true,
          active: !!e,
          entitlement: e || null
        });
      }


      /*
       * GUMROAD VERIFY
       */
      if (
        url.pathname ===
          "/api/gumroad/verify" &&
        request.method === "POST"
      ) {
        const b = await request.json();

        const product_permalink =
          String(
            b.product_permalink || ""
          ).trim();

        const license_key =
          String(
            b.license_key || ""
          ).trim();

        if (
          !product_permalink ||
          !license_key
        ) {
          return json(
            {
              ok: false,
              valid: false,
              message:
                "Product and license key are required."
            },
            400
          );
        }

        const gb =
          new URLSearchParams({
            product_permalink,
            license_key,
            increment_uses_count:
              "false"
          });

        const gr = await fetch(
          "https://api.gumroad.com/v2/licenses/verify",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/x-www-form-urlencoded"
            },
            body: gb.toString()
          }
        );

        const d = await gr.json();

        const p =
          d && d.purchase
            ? d.purchase
            : {};

        const valid =
          d &&
          d.success === true &&
          p.refunded !== true &&
          p.chargebacked !== true &&
          p.disputed !== true;

        return json({
          ok: true,
          valid,
          message: valid
            ? "Gumroad purchase verified."
            : "This license is not valid for this product.",
          purchase: valid
            ? {
                email:
                  p.email ||
                  p.buyer_email ||
                  "",
                product_name:
                  p.product_name || "",
                purchase_id:
                  p.id || "",
                test:
                  p.test === true
              }
            : null
        });
      }


      /*
       * GUMROAD ACTIVATE
       */
      if (
        url.pathname ===
          "/api/gumroad/activate" &&
        request.method === "POST"
      ) {
        if (dbMissing(env)) {
          return json(
            {
              ok: false,
              message:
                "Authentication database is not configured yet."
            },
            503
          );
        }

        const u =
          await requireUser(
            request,
            env
          );

        const b =
          await request.json();

        const product_permalink =
          String(
            b.product_permalink || ""
          ).trim();

        const license_key =
          String(
            b.license_key || ""
          ).trim();

        const tool_slug =
          String(
            b.tool_slug || ""
          ).trim();

        if (
          !TOOL_SLUGS.has(tool_slug) ||
          !product_permalink ||
          !license_key
        ) {
          return json(
            {
              ok: false,
              message:
                "Invalid activation request."
            },
            400
          );
        }

        const gb =
          new URLSearchParams({
            product_permalink,
            license_key,
            increment_uses_count:
              "false"
          });

        const gr = await fetch(
          "https://api.gumroad.com/v2/licenses/verify",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/x-www-form-urlencoded"
            },
            body: gb.toString()
          }
        );

        const d =
          await gr.json();

        const p =
          d && d.purchase
            ? d.purchase
            : {};

        const valid =
          d &&
          d.success === true &&
          p.refunded !== true &&
          p.chargebacked !== true &&
          p.disputed !== true;

        if (!valid) {
          return json(
            {
              ok: false,
              message:
                "Gumroad could not verify this purchase."
            },
            400
          );
        }

        const purchaseEmail =
          String(
            p.email ||
              p.buyer_email ||
              ""
          )
            .trim()
            .toLowerCase();

        if (
          purchaseEmail &&
          purchaseEmail !==
            u.email.toLowerCase()
        ) {
          return json(
            {
              ok: false,
              message:
                "The Gumroad purchase email does not match your SeachLoomAI account email."
            },
            403
          );
        }

        await env.DB
          .prepare(
            `INSERT INTO entitlements(
              id,
              purchase_id,
              email,
              tool_slug,
              product_permalink,
              status,
              access_type,
              created_at,
              updated_at
            )
            VALUES(
              ?,
              ?,
              ?,
              ?,
              ?,
              'active',
              'lifetime',
              datetime('now'),
              datetime('now')
            )
            ON CONFLICT(email,tool_slug)
            DO UPDATE SET
              purchase_id=excluded.purchase_id,
              product_permalink=excluded.product_permalink,
              status='active',
              access_type='lifetime',
              updated_at=datetime('now')`
          )
          .bind(
            randomId(),
            String(
              p.id ||
                license_key
            ),
            u.email,
            tool_slug,
            product_permalink
          )
          .run();

        return json({
          ok: true,
          message:
            "Lifetime access activated.",
          tool_slug
        });
      }


      /*
       * TOOL PREVIEW
       */
      if (
        url.pathname ===
          "/api/tool/preview" &&
        request.method === "POST"
      ) {
        const b =
          await request.json();

        const tool =
          String(
            b.tool || ""
          );

        const input =
          String(
            b.input || ""
          );

        if (
          !TOOL_SLUGS.has(tool)
        ) {
          return json(
            {
              ok: false,
              message:
                "Unknown tool."
            },
            400
          );
        }

        return json({
          ok: true,
          tool,
          preview:
            "Preview generated. The full analysis is protected.",
          unlock: true,
          input
        });
      }


      /*
       * WRITE FOR US
       */
      if (
        url.pathname ===
          "/api/write-for-us" &&
        request.method === "POST"
      ) {
        const data =
          await request.json();

        if (env.DB) {
          await env.DB
            .prepare(
              `INSERT INTO publisher_submissions(
                id,
                name,
                email,
                website,
                linkedin,
                title,
                category,
                content,
                requested_links
              )
              VALUES(
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
              )`
            )
            .bind(
              randomId(),
              data.name || "",
              data.email || "",
              data.website || "",
              data.linkedin || "",
              data.title || "",
              data.category || "",
              data.content || "",
              data.links || ""
            )
            .run();
        }

        return json({
          ok: true,
          message:
            "Submission received for editorial review."
        });
      }


      /*
       * STATIC ASSETS
       */
      /*
 * STATIC ASSETS
 */

/* SEO: robots.txt */
if (url.pathname === "/robots.txt") {
  return new Response(
    `User-agent: *
Allow: /

Sitemap: https://seachloomai.shop/sitemap.xml`,
    {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600"
      }
    }
  );
}

/* SEO: sitemap.xml */
if (url.pathname === "/sitemap.xml") {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://seachloomai.shop/</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/ai-content-optimizer.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/keyword-researcher.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/keyword-clusterer.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/search-intent.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/keyword-opportunity.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/seo-brief.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/content-gap.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/content-outline.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/onpage-audit.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/meta-generator.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/internal-links.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/schema-generator.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/ai-visibility.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/ai-citations.html</loc>
  </url>
  <url>
    <loc>https://seachloomai.shop/tools/geo-optimizer.html</loc>
  </url>
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600"
    }
  });
}
/* Serve homepage at root URL */
if (url.pathname === "/" && env.ASSETS && typeof env.ASSETS.fetch === "function") {
  const homepageUrl = new URL("/index.html", request.url);
  const homepageRequest = new Request(homepageUrl, request);
  return env.ASSETS.fetch(homepageRequest);
}
/* Serve normal website assets */
if (env.ASSETS && typeof env.ASSETS.fetch === "function") {

  const assetUrl = new URL(request.url);

  if (assetUrl.pathname === "/") {
    assetUrl.pathname = "/index.html";
  }

  return env.ASSETS.fetch(
    new Request(assetUrl.toString(), request)
  );
});
          } catch (e) {
      return json(
        {
          ok: false,
          message: e?.message || "Server error."
        },
        500
      );
    }
  }
};
