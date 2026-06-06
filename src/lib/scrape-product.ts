export type ScrapedProduct = {
  name: string | null;
  image: string | null;
  price: string | null;
  description: string | null;
  url: string;
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return null;
}

function extractTitle(html: string): string | null {
  return (
    extractMeta(html, "og:title") ??
    extractMeta(html, "twitter:title") ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
    null
  );
}

function extractImage(html: string, baseUrl: string): string | null {
  const raw =
    extractMeta(html, "og:image") ??
    extractMeta(html, "twitter:image") ??
    extractMeta(html, "twitter:image:src");
  if (!raw) return null;
  try {
    return new URL(raw, baseUrl).href;
  } catch {
    return raw.startsWith("http") ? raw : null;
  }
}

function extractDescription(html: string): string | null {
  return (
    extractMeta(html, "og:description") ??
    extractMeta(html, "description") ??
    extractMeta(html, "twitter:description")
  );
}

function extractJsonLdProduct(html: string): Partial<ScrapedProduct> {
  const scripts = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!scripts) return {};

  for (const block of scripts) {
    const jsonText = block.replace(/<\/?script[^>]*>/gi, "").trim();
    try {
      const data = JSON.parse(jsonText) as unknown;
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const obj = item as Record<string, unknown>;
        const graph = obj["@graph"];
        const nodes = graph && Array.isArray(graph) ? graph : [obj];
        for (const node of nodes) {
          const n = node as Record<string, unknown>;
          const type = String(n["@type"] ?? "").toLowerCase();
          if (!type.includes("product")) continue;
          const offers = n.offers as Record<string, unknown> | undefined;
          const price =
            offers?.price ??
            offers?.lowPrice ??
            (Array.isArray(offers) ? offers[0]?.price : undefined);
          const currency =
            offers?.priceCurrency ??
            (Array.isArray(offers) ? offers[0]?.priceCurrency : undefined);
          const image = n.image;
          let imageUrl: string | null = null;
          if (typeof image === "string") imageUrl = image;
          else if (Array.isArray(image) && typeof image[0] === "string") {
            imageUrl = image[0];
          } else if (image && typeof image === "object" && "url" in image) {
            imageUrl = String((image as { url: string }).url);
          }
          return {
            name: typeof n.name === "string" ? n.name : null,
            image: imageUrl,
            price:
              price != null
                ? currency
                  ? `${price} ${currency}`
                  : String(price)
                : null,
            description:
              typeof n.description === "string" ? n.description : null,
          };
        }
      }
    } catch {
      /* try next block */
    }
  }
  return {};
}

function extractPriceFromHtml(html: string): string | null {
  const priceMatch = html.match(
    /(?:itemprop=["']price["'][^>]*content=["']([^"']+)["']|class=["'][^"']*price[^"']*["'][^>]*>([^<]+))/i
  );
  if (priceMatch?.[1]) return decodeHtmlEntities(priceMatch[1].trim());
  if (priceMatch?.[2]) return decodeHtmlEntities(priceMatch[2].trim());
  return null;
}

export async function scrapeProductUrl(
  url: string
): Promise<{ ok: true; product: ScrapedProduct } | { ok: false; error: string }> {
  const trimmed = url.trim();
  if (!trimmed) {
    return { ok: false, error: "URL erforderlich." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return { ok: false, error: "Ungültige URL." };
  }

  try {
    const res = await fetch(parsed.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; InfluexAI/1.0; +https://influexai.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `Seite konnte nicht geladen werden (${res.status}).`,
      };
    }

    const html = await res.text();
    const jsonLd = extractJsonLdProduct(html);

    const product: ScrapedProduct = {
      url: parsed.href,
      name: jsonLd.name ?? extractTitle(html),
      image: jsonLd.image ?? extractImage(html, parsed.href),
      description: jsonLd.description ?? extractDescription(html),
      price: jsonLd.price ?? extractPriceFromHtml(html),
    };

    if (!product.name && !product.image) {
      return {
        ok: false,
        error:
          "Keine Produktdaten gefunden. Bitte Bild hochladen oder Details manuell eingeben.",
      };
    }

    return { ok: true, product };
  } catch {
    return { ok: false, error: "Produktseite konnte nicht geladen werden." };
  }
}
