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
      if (
        url.pathname === "/" &&
        env.ASSETS &&
        typeof env.ASSETS.fetch === "function"
      ) {
        const homepageUrl =
          new URL("/index.html", request.url);

        const homepageRequest =
          new Request(homepageUrl, request);

        return env.ASSETS.fetch(homepageRequest);
      }


      /* Serve normal website assets */
      if (
        env.ASSETS &&
        typeof env.ASSETS.fetch === "function"
      ) {
        const assetUrl =
          new URL(request.url);

        if (assetUrl.pathname === "/") {
          assetUrl.pathname = "/index.html";
        }

        return env.ASSETS.fetch(
          new Request(
            assetUrl.toString(),
            request
          )
        );
      }

    } catch (e) {

      return json(
        {
          ok: false,
          message:
            e?.message || "Server error."
        }
      );

    }

  }
};
