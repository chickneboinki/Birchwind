import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { devSignIn } from "@/lib/astra/dev-access.functions";
import { ArrowRight, Accessibility, Power, UserRound, Wifi, LockKeyhole, Monitor } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Birchwind" }, { name: "description", content: "Sign in to your Birchwind desktop." }] }),
  component: AuthPage,
});

const usernameEmail = (value: string) => `${value.trim().toLowerCase()}@users.birchwind.app`;

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("Chance");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminAccount, setAdminAccount] = useState<"qais" | "chance">("chance");
  const signInAdmin = useServerFn(devSignIn);

  useEffect(() => { if (session) navigate({ to: "/chat", replace: true }); }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = username.trim();
    if (!/^[a-zA-Z0-9._-]{3,24}$/.test(clean)) { toast.error("Username must be 3–24 letters, numbers, dots, dashes, or underscores."); return; }
    if (password.length < 8) { toast.error("Use a password with at least 8 characters."); return; }
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email: usernameEmail(clean), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: usernameEmail(clean), password, options: { data: { username: clean } } });
        if (error) throw error;
        if (!data.session) throw new Error("Supabase email confirmation is still enabled. Disable Confirm email in Supabase Auth settings to finish username-only signup.");
        toast.success("Account created.");
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Sign-in failed."); }
    finally { setBusy(false); }
  }

  async function adminSubmit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const res = await signInAdmin({ data: { code: adminCode, account: adminAccount } });
      if (!res.ok) throw new Error(res.error);
      const { error } = await supabase.auth.verifyOtp({ token_hash: res.tokenHash, type: "magiclink" });
      if (error) throw error;
    } catch (err) { toast.error(err instanceof Error ? err.message : "Admin sign-in failed."); }
    finally { setBusy(false); }
  }

  const profiles = [{ label: "Chance", username: "Chance" }, { label: "Qais", username: "Qais" }];
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[#061b65] text-white">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "radial-gradient(ellipse at 16% 20%, rgba(77,156,255,.8), transparent 35%), radial-gradient(ellipse at 80% 85%, rgba(0,5,40,.95), transparent 48%), linear-gradient(125deg,#1639a5 0%,#092477 42%,#030b32 100%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(ellipse at 35% 45%, transparent 0 22%, rgba(124,197,255,.55) 22.2%, transparent 22.8%), radial-gradient(ellipse at 5% 75%, transparent 0 28%, rgba(105,181,255,.45) 28.2%, transparent 28.8%), linear-gradient(135deg, transparent 45%, rgba(95,160,255,.22) 46%, transparent 47%)" }} />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="mb-5 flex size-24 items-center justify-center rounded-full bg-slate-200/80 text-slate-800 shadow-xl ring-1 ring-white/30">
          <UserRound className="size-14 stroke-[1.2]" />
        </div>
        <p className="mb-7 text-2xl font-semibold tracking-tight">{mode === "up" ? "Create your account" : username || "Sign in"}</p>
        {mode === "in" ? (
          <form onSubmit={submit} className="w-full max-w-[330px] space-y-3">
            <label className="sr-only" htmlFor="username">Username</label>
            <select aria-label="Choose account" value={username} onChange={e => { setUsername(e.target.value); setPassword(""); }} className="mb-2 h-10 w-full rounded-md border border-white/20 bg-[#071744]/90 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-sky-300">
              <option value="Chance">Chance</option><option value="Qais">Qais</option>
            </select>
            <div className="flex h-11 items-center overflow-hidden rounded-md border border-sky-300/70 bg-[#06133c]/90 focus-within:ring-2 focus-within:ring-sky-300">
              <input aria-label="Password" autoComplete="current-password" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-slate-300" />
              <button aria-label="Sign in" type="submit" disabled={busy} className="h-full px-3 hover:bg-white/10 disabled:opacity-50"><ArrowRight className="size-5" /></button>
            </div>
            <button type="button" onClick={() => setMode("up")} className="w-full pt-3 text-sm text-white/85 hover:text-white">Create an account</button>
          </form>
        ) : (
          <form onSubmit={submit} className="w-full max-w-[330px] space-y-3 rounded-xl border border-white/20 bg-slate-950/45 p-4 backdrop-blur-md">
            <label className="block text-sm" htmlFor="new-username">Username</label>
            <input id="new-username" autoComplete="username" required minLength={3} maxLength={24} value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" className="h-11 w-full rounded-md border border-white/20 bg-black/30 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-300" />
            <label className="block text-sm" htmlFor="new-password">Password</label>
            <input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a password (8+ characters)" className="h-11 w-full rounded-md border border-white/20 bg-black/30 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-300" />
            <button disabled={busy} className="h-11 w-full rounded-md bg-white font-semibold text-slate-900 disabled:opacity-50">{busy ? "Please wait…" : "Create account"}</button>
            <button type="button" onClick={() => setMode("in")} className="w-full text-sm text-white/80">Back to sign in</button>
          </form>
        )}
        <button type="button" onClick={() => setAdminOpen(v => !v)} className="mt-7 text-xs text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white">Admin sign-in</button>
        {adminOpen && <form onSubmit={adminSubmit} className="mt-3 w-full max-w-[330px] space-y-3 rounded-xl border border-white/20 bg-slate-950/60 p-4 backdrop-blur-md">
          <select aria-label="Admin account" value={adminAccount} onChange={e => setAdminAccount(e.target.value as "qais" | "chance")} className="h-10 w-full rounded-md border border-white/20 bg-slate-900 px-3 text-sm"><option value="chance">Chance account</option><option value="qais">Qais account</option></select>
          <input aria-label="Admin access code" inputMode="numeric" required value={adminCode} onChange={e => setAdminCode(e.target.value)} placeholder="Admin access code" className="h-10 w-full rounded-md border border-white/20 bg-black/30 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-300" />
          <button disabled={busy} className="h-10 w-full rounded-md bg-white font-medium text-slate-900">{busy ? "Signing in…" : "Enter admin mode"}</button>
        </form>}
      </div>
      <div className="relative z-10 flex items-center justify-end gap-5 px-7 pb-6 text-white/90">
        <span className="flex items-center gap-2 text-xs"><Wifi className="size-4" /> Birchwind</span>
        <button aria-label="Accessibility options" className="rounded-full p-2 hover:bg-white/10"><Accessibility className="size-5" /></button>
        <button aria-label="Power options" className="rounded-full p-2 hover:bg-white/10"><Power className="size-5" /></button>
      </div>
    </main>
  );
}
