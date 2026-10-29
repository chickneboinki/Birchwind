import type { VercelRequest, VercelResponse } from "@vercel/node";
const KEY = "0ea74aa80d71c4dc484c0a58f26ea7b8";
const BASE = "https://api.themoviedb.org/3";
const IMAGE = "https://image.tmdb.org/t/p";
const blocked = (host: string) => /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(host) || host.endsWith(".localhost") || host.endsWith(".internal");
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") return res.status(405).send("Method not allowed");
  try {
    const tmdb = req.query.tmdb;
    if (typeof tmdb === "string") {
      if (!tmdb.startsWith("/") || tmdb.includes("..")) return res.status(400).send("Bad path");
      const target = new URL(BASE + tmdb);
      target.searchParams.set("api_key", KEY);
      for (const [k, v] of Object.entries(req.query)) if (k !== "tmdb" && k !== "token" && typeof v === "string") target.searchParams.set(k, v);
      const upstream = await fetch(target);
      res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
    }
    const img = req.query.img;
    if (typeof img === "string") {
      if (!/^\/[a-z0-9]+\/[-\w./]+$/i.test(img) || img.includes("..")) return res.status(400).send("Bad image path");
      const upstream = await fetch(IMAGE + img);
      res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
    }
    const embed = req.query.embed;
    if (typeof embed === "string") {
      let target: URL; try { target = new URL(embed); } catch { return res.status(400).send("Bad url"); }
      if (!/^https?:$/.test(target.protocol) || blocked(target.hostname)) return res.status(400).send("Blocked url");
      const upstream = await fetch(target, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0", referer: target.origin + "/" } });
      const type = upstream.headers.get("content-type") ?? "application/octet-stream";
      res.setHeader("Content-Type", type.includes("text/html") ? "text/html; charset=utf-8" : type);
      res.setHeader("Cache-Control", "no-store");
      return res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
    }
    return res.status(400).send("Missing tmdb or img parameter");
  } catch (e) { return res.status(502).json({ error: e instanceof Error ? e.message : "Movie service failed" }); }
}
