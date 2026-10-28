import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AstraMark } from "@/components/astra/Mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { devSignIn } from "@/lib/astra/dev-access.functions";
import { LockKeyhole, UserRound, ShieldCheck, Monitor } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Birchwind" },
      { name: "description", content: "Sign in to your Birchwind desktop." },
    ],
  }),
  component: AuthPage,
});

const usernameEmail = (value: string) => `${value.trim().toLowerCase()}@users.birchwind.app`;

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/chat", replace: true });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9._-]{3,24}$/.test(cleanUsername)) {
      toast.error("Use 3–24 characters: letters, numbers, dots, dashes, or underscores.");
      return;
    }
    if (password.length < 8) {
      toast.error("Use a password with at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const email = usernameEmail(cleanUsername);
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: cleanUsername } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.error("Birchwind's Supabase project still requires email confirmation. Turn off Confirm email in Supabase Auth settings to enable username-and-password-only signup.");
        } else {
          toast.success("Your Birchwind account is ready.");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#080b12] px-5 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(ellipse at 50% 15%, rgba(88,130,200,.25), transparent 52%), linear-gradient(135deg, transparent 48%, rgba(255,255,255,.025) 49%, transparent 50%)" }} />
      <div className="relative w-full max-w-[420px] animate-rise">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] shadow-2xl shadow-black/40">
            <AstraMark className="size-9" />
          </div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.28em] text-slate-400">Birchwind</p>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to your desktop</p>
        </div>

        <section className="rounded-2xl border border-white/12 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-sky-400/15 text-sky-200"><Monitor className="size-5" /></div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Birchwind account</p>
              <p className="text-xs text-slate-400">Username and password</p>
            </div>
            <ShieldCheck className="ml-auto size-5 text-emerald-300" />
          </div>
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-black/30 p-1">
            <button type="button" onClick={() => setMode("in")} className={`rounded-md px-3 py-2 text-sm transition ${mode === "in" ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}>Sign in</button>
            <button type="button" onClick={() => setMode("up")} className={`rounded-md px-3 py-2 text-sm transition ${mode === "up" ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}>Create account</button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm text-slate-200">Username</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input id="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={24} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" className="h-11 border-white/15 bg-black/25 pl-10 text-white placeholder:text-slate-500 focus-visible:ring-sky-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-slate-200">Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input id="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="h-11 border-white/15 bg-black/25 pl-10 text-white placeholder:text-slate-500 focus-visible:ring-sky-400" />
              </div>
            </div>
            <Button type="submit" className="h-11 w-full bg-sky-300 font-semibold text-slate-950 hover:bg-sky-200" disabled={busy}>
              {busy ? "Please wait…" : mode === "in" ? "Sign in to Birchwind" : "Create Birchwind account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">No email address or two-factor code is requested on this screen.</p>
        </section>
        <AdminMode />
        <p className="mt-6 text-center text-xs text-slate-600">Your personal desktop experience</p>
      </div>
    </main>
  );
}

function AdminMode() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [account, setAccount] = useState<"qais" | "chance">("qais");
  const [busy, setBusy] = useState(false);
  const signIn = useServerFn(devSignIn);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await signIn({ data: { code, account } });
      if (!res.ok) throw new Error(res.error);
      const { error } = await supabase.auth.verifyOtp({ token_hash: res.tokenHash, type: "magiclink" });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't sign in");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mx-auto mt-5 block text-xs text-slate-500 hover:text-slate-200">Admin sign-in</button>;
  return (
    <form onSubmit={go} className="mt-4 space-y-3 rounded-xl border border-white/10 bg-slate-900/80 p-4">
      <div className="flex gap-2">
        {(["qais", "chance"] as const).map((a) => <button key={a} type="button" onClick={() => setAccount(a)} className={`flex-1 rounded-md border border-white/10 px-3 py-2 text-sm capitalize ${account === a ? "bg-white/10 text-white" : "text-slate-400"}`}>{a}</button>)}
      </div>
      <Input inputMode="numeric" autoFocus placeholder="Admin access code" value={code} onChange={(e) => setCode(e.target.value)} className="border-white/15 bg-black/25 text-white" />
      <Button type="submit" className="w-full" disabled={busy || !code}>{busy ? "Signing in…" : "Enter admin mode"}</Button>
    </form>
  );
}
