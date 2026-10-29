import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const strip = (h: string) =>
  h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ").trim();

function decodeResultUrl(raw: string): string {
  try {
    const u = new URL(raw, "https://html.duckduckgo.com");
    const target = u.searchParams.get("uddg");
    const result = target ? decodeURIComponent(target) : raw;
    return /^https?:\/\//i.test(result) ? result : "";
  } catch { return ""; }
}

export const webSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().min(1).max(300) }).parse(d))
  .handler(async ({ data }) => {
    const endpoints = [
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(data.q)}`,
      `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(data.q)}`,
    ];
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "Accept-Language": "en-US,en;q=0.9" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const html = await res.text();
        const results: { title: string; url: string; snippet: string }[] = [];
        // Attribute order varies between DuckDuckGo's HTML and Lite layouts.
        const anchors = [...html.matchAll(/<a\b(?=[^>]*\bclass=["'][^"']*\bresult__a\b)(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>([\s\S]*?)<\/a>/gi)];
        for (let i = 0; i < anchors.length && results.length < 20; i++) {
          const a = anchors[i]!;
          const url = decodeResultUrl(a[1] ?? "");
          const title = strip(a[2] ?? "");
          if (!url || !title || /duckduckgo\.com\/y\.js/i.test(url)) continue;
          const start = (a.index ?? 0) + a[0].length;
          const end = anchors[i + 1]?.index ?? Math.min(html.length, start + 3500);
          const block = html.slice(start, end);
          const snip = block.match(/<(?:a|div|td)[^>]*class=["'][^"']*\b(?:result__snippet|result-snippet|snippet)\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|div|td)>/i);
          results.push({ title, url, snippet: strip(snip?.[1] ?? "") });
        }
        if (results.length) return { results };
      } catch { /* try the alternate search page */ }
    }
    return { results: [] as { title: string; url: string; snippet: string }[] };
  });
