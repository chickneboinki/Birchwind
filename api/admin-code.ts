import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const { code, username } = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
  const account = String(username ?? "").trim().toLowerCase();
  const expected = process.env.BIRCHWIND_ADMIN_CODE;
  if (!expected || !["chance", "qais"].includes(account) || typeof code !== "string" || code.length > 128 || code !== expected) {
    return res.status(403).json({ ok: false });
  }
  return res.status(200).json({ ok: true });
}
