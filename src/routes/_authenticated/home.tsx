import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Brain, Film, Gamepad2, Globe, LayoutGrid, Search, Settings } from "lucide-react";
import { usePrefs } from "@/lib/astra/prefs";
import { MobileMenuButton } from "@/components/astra/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — BirchBlock" },
      { name: "description", content: "Your BirchBlock launcher: AI, web, movies and games in one place." },
      { property: "og:title", content: "Home — BirchBlock" },
      { property: "og:description", content: "Your BirchBlock launcher: AI, web, movies and games in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const APPS = [
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/chat", label: "AI", icon: Bot },
  { to: "/movies", label: "Movies", icon: Film },
  { to: "/web", label: "Web", icon: Globe },
  { to: "/memory", label: "Memory", icon: Brain },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Home() {
  const p = usePrefs();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex h-12 items-center px-3 md:hidden"><MobileMenuButton /></header>
      <div className="windows-home mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        {p.showClock && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card/70 px-4 py-2 text-sm text-muted-foreground shadow-sm"><span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,.65)]" />{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
        )}
        <h1 className={cn("windows-home-title text-6xl font-semibold tracking-tight md:text-8xl", p.glowTitle && "title-glow")}>{p.homeName === "astra" || !p.homeName ? "birchblock" : p.homeName}</h1>
        <p className="mt-3 text-base text-muted-foreground">{p.tagline}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) navigate({ to: "/web", search: { q: q.trim() } });
          }}
          className="windows-search-box mt-8 flex w-full max-w-2xl items-center gap-3 rounded-2xl border bg-card/80 px-5 py-4 shadow-lg backdrop-blur-xl"
        >
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search apps, settings, the web, and more" className="flex-1 bg-transparent text-sm outline-none" />
        </form>
        <div className="mt-12 grid w-full max-w-3xl grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
          {APPS.map((a) => (
            <Link key={a.to} to={a.to} className="windows-home-app group flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-border hover:bg-card/70">
              <span className="flex size-14 items-center justify-center rounded-2xl border bg-card shadow-sm transition group-hover:-translate-y-1 group-hover:border-sky-400/50 group-hover:shadow-lg">
                <a.icon className="size-5" />
              </span>
              <span className="text-xs font-medium">{a.label}</span>
            </Link>
          ))}
          <Link to="/settings" className="group flex w-16 flex-col items-center gap-2">
            <span className="flex size-14 items-center justify-center rounded-full border bg-card/60 text-muted-foreground transition group-hover:border-star">
              <LayoutGrid className="size-5" />
            </span>
            <span className="text-xs text-muted-foreground">Layout</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
