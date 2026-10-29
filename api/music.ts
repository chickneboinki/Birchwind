import type { VercelRequest, VercelResponse } from "@vercel/node";

const DZ = "https://api.deezer.com";
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36" };
const send = (res: VercelResponse, status: number, data: unknown) => res.status(status).setHeader("Cache-Control", "public, max-age=300").json(data);
async function dz(path: string): Promise<any> {
  try { const r = await fetch(`${DZ}${path}`, { headers: UA }); return r.ok ? await r.json() : {}; } catch { return {}; }
}
const track = (t: any, album?: any) => ({
  id: String(t.id ?? ""), title: t.title ?? "", artist: t.artist?.name ?? t.user?.name ?? "",
  artistId: String(t.artist?.id ?? ""), album: t.album?.title ?? album?.title ?? t.release_title ?? "",
  albumId: String(t.album?.id ?? album?.id ?? ""), art: t.album?.cover_big ?? album?.cover_big ?? t.artwork?.["480x480"] ?? "",
  duration: Math.max(0, Math.floor(t.duration ?? 0)), preview: t.preview ?? "",
});
const albumOf = (a: any) => ({ id: String(a.id ?? ""), title: a.title ?? "", artist: a.artist?.name ?? "", art: a.cover_big ?? "", year: (a.release_date ?? "").slice(0, 4) });
const artistOf = (a: any) => ({ id: String(a.id ?? ""), name: a.name ?? "", art: a.picture_big ?? "", fans: a.nb_fan ?? 0 });
async function audius(q?: string): Promise<any[]> {
  const url = q ? `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=birchwind&limit=30` : "https://api.audius.co/v1/tracks/trending?app_name=birchwind&limit=30";
  try {
    const r = await fetch(url, { headers: UA }); if (!r.ok) return [];
    const d: any = await r.json();
    return (d.data ?? []).filter((t: any) => t?.id && t?.title).map(track);
  } catch { return []; }
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") return res.status(405).json({ error: "Method not allowed" });
  const op = String(req.query.op ?? "");
  const q = String(req.query.q ?? "").slice(0, 200);
  try {
    if (op === "home") {
      const d = await dz("/chart/0?limit=30");
      const tracks = (d.tracks?.data ?? []).map(track);
      return send(res, 200, tracks.length ? { tracks, albums: (d.albums?.data ?? []).map(albumOf), artists: (d.artists?.data ?? []).map(artistOf) } : { tracks: await audius(), albums: [], artists: [] });
    }
    if (op === "search") {
      const [t, a, ar] = await Promise.all([dz(`/search?q=${encodeURIComponent(q)}&limit=30`), dz(`/search/album?q=${encodeURIComponent(q)}&limit=20`), dz(`/search/artist?q=${encodeURIComponent(q)}&limit=12`)]);
      const tracks = (t.data ?? []).map(track);
      return send(res, 200, tracks.length ? { tracks, albums: (a.data ?? []).map(albumOf), artists: (ar.data ?? []).map(artistOf) } : { tracks: await audius(q), albums: [], artists: [] });
    }
    if (op === "album" || op === "artist") {
      const id = String(req.query.id ?? "");
      if (!/^\d{1,15}$/.test(id)) return send(res, 400, { error: "Invalid id" });
      if (op === "album") { const a = await dz(`/album/${id}`); return send(res, 200, { ...albumOf(a), tracks: (a.tracks?.data ?? []).map((t: any) => track(t, a)) }); }
      const [a, top, albums] = await Promise.all([dz(`/artist/${id}`), dz(`/artist/${id}/top?limit=20`), dz(`/artist/${id}/albums?limit=40`)]);
      return send(res, 200, { ...artistOf(a), tracks: (top.data ?? []).map(track), albums: (albums.data ?? []).map((x: any) => albumOf({ ...x, artist: a })) });
    }
    if (op === "art") {
      const src = String(req.query.src ?? "");
      if (!/^https:\/\/([a-z0-9-]+\.)*(dzcdn\.net|deezer\.com|mzstatic\.com|audius\.co)\//i.test(src)) return res.status(400).send("Bad url");
      const r = await fetch(src); res.setHeader("Content-Type", r.headers.get("content-type") ?? "image/jpeg"); res.setHeader("Cache-Control", "public, max-age=86400");
      return res.status(r.status).send(Buffer.from(await r.arrayBuffer()));
    }
    if (op === "resolve") {
      const server = String(req.query.server ?? "");
      if (server === "deezer") return send(res, 200, { url: /^https:\/\/[a-z0-9-]+\.dzcdn\.net\//i.test(String(req.query.preview ?? "")) ? String(req.query.preview) : null });
      if (server === "audius") {
        const d: any = await (await fetch(`https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=birchwind`)).json().catch(() => ({}));
        const t = (d.data ?? []).find((x: any) => x?.is_streamable !== false);
        return send(res, 200, { url: t ? `https://api.audius.co/v1/tracks/${encodeURIComponent(t.id)}/stream?app_name=birchwind` : null });
      }
      return send(res, 200, { url: null, error: "Choose Audius or Deezer preview" });
    }
    if (op === "audio") {
      const src = String(req.query.u ?? "");
      if (!/^https:\/\/(([a-z0-9-]+\.)*(dzcdn\.net|sndcdn\.com)\/|api\.audius\.co\/v1\/tracks\/)/i.test(src)) return res.status(400).send("Bad url");
      const headers: Record<string,string> = { ...UA }; if (req.headers.range) headers.range = String(req.headers.range);
      const r = await fetch(src, { headers, redirect: "follow" });
      res.status(r.status); res.setHeader("Content-Type", r.headers.get("content-type") ?? "audio/mpeg");
      res.setHeader("Accept-Ranges", "bytes"); res.setHeader("Cache-Control", "public, max-age=3600");
      const len = r.headers.get("content-length"), range = r.headers.get("content-range");
      if (len) res.setHeader("Content-Length", len); if (range) res.setHeader("Content-Range", range);
      return res.send(Buffer.from(await r.arrayBuffer()));
    }
    if (op === "lyrics") {
      const artist = String(req.query.artist ?? "");
      const r = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(q)}`).catch(() => null);
      const d: any = r?.ok ? await r.json().catch(() => ({})) : {};
      return send(res, 200, { lyrics: d.lyrics ?? "" });
    }
    if (op === "video") return send(res, 200, { ids: [] });
    return send(res, 400, { error: "Unknown op" });
  } catch (e) { return send(res, 502, { error: e instanceof Error ? e.message : "Music service failed" }); }
}
