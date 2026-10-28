import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bot, Film, Gamepad2, Globe, Music, Search, ShoppingBag, Check, Download, ArrowUpRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/store")({
  head: () => ({ meta: [{ title: "App Store — Birchwind" }, { name: "description", content: "Discover and launch Birchwind apps." }] }),
  component: AppStore,
});

const APPS = [
  { id: "ai", name: "Birch AI", category: "AI & Productivity", description: "Chat, voice conversations, saved memory, and AI tools.", to: "/chat", icon: Bot, color: "bg-violet-500/15 text-violet-500", included: true },
  { id: "movies", name: "Movies & TV", category: "Entertainment", description: "Discover films and series, browse details, and launch available watch sources.", to: "/movies", icon: Film, color: "bg-rose-500/15 text-rose-500", included: true },
  { id: "music", name: "Music", category: "Entertainment", description: "Search artists, albums, and tracks; build playlists and listen to previews.", to: "/music", icon: Music, color: "bg-emerald-500/15 text-emerald-500", included: true },
  { id: "notes", name: "Notes", category: "Productivity", description: "Create, pin, search, and auto-save notes on this device.", to: "/notes", icon: FileText, color: "bg-amber-500/15 text-amber-500", included: true },
  { id: "web", name: "Birch Browser", category: "Internet", description: "Browse the web from inside Birchwind.", to: "/web", icon: Globe, color: "bg-sky-500/15 text-sky-500", included: true },
  { id: "games", name: "Games", category: "Games", description: "Play browser games in Birchwind.", to: "/games", icon: Gamepad2, color: "bg-amber-500/15 text-amber-500", included: true },
] as const;

const KEY = "birchwind-installed-apps";

function readInstalled() {
  if (typeof window === "undefined") return APPS.map((a) => a.id);
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) as string[] : APPS.map((a) => a.id);
  } catch { return APPS.map((a) => a.id); }
}

function AppStore() {
  const [installed, setInstalled] = useState<string[]>(() => readInstalled());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All apps");

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(installed)); window.dispatchEvent(new CustomEvent("birchwind:apps-changed", { detail: installed })); }, [installed]);

  const visible = useMemo(() => APPS.filter((app) => {
    const q = query.toLowerCase().trim();
    return (!q || [app.name, app.description, app.category].some((v) => v.toLowerCase().includes(q))) &&
      (filter === "All apps" || (filter === "Installed" ? installed.includes(app.id) : !installed.includes(app.id)));
  }), [query, filter, installed]);

  return (
    <div className="h-full overflow-y-auto bg-background px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><ShoppingBag className="size-4" /> Birchwind Store</div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Find your next app</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Your Birchwind apps live here. Install them to keep them in your app collection, or open them straight away.</p>
          </div>
          <div className="rounded-2xl border bg-card px-4 py-3 text-sm"><div className="text-muted-foreground">Installed apps</div><div className="mt-1 text-2xl font-semibold">{installed.length}<span className="ml-1 text-sm font-normal text-muted-foreground">/ {APPS.length}</span></div></div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-xl border bg-card px-3 py-2.5"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search apps" className="w-full bg-transparent text-sm outline-none" /></label>
          <div className="flex gap-2">
            {["All apps", "Installed", "Not installed"].map((f) => <button key={f} onClick={() => setFilter(f)} className={cn("rounded-xl border px-3 py-2 text-sm", filter === f ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}>{f}</button>)}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((app) => {
            const Icon = app.icon;
            const isInstalled = installed.includes(app.id);
            return <article key={app.id} className="flex min-h-52 flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className={cn("flex size-14 shrink-0 items-center justify-center rounded-2xl", app.color)}><Icon className="size-7" /></div>
                <div className="min-w-0 flex-1"><h2 className="font-semibold">{app.name}</h2><p className="mt-1 text-xs text-muted-foreground">{app.category}</p></div>
                {isInstalled && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600"><Check className="size-3" /> Installed</span>}
              </div>
              <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{app.description}</p>
              <div className="mt-5 flex gap-2">
                <Link to={app.to} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Open app <ArrowUpRight className="size-4" /></Link>
                <button onClick={() => setInstalled((old) => isInstalled ? old.filter((id) => id !== app.id) : [...old, app.id])} className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm hover:bg-accent" aria-label={isInstalled ? `Uninstall ${app.name}` : `Install ${app.name}`}><Download className="size-4" />{isInstalled ? "Remove" : "Install"}</button>
              </div>
            </article>;
          })}
        </div>
        {visible.length === 0 && <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No apps match that search.</div>}
        <p className="mt-8 text-xs text-muted-foreground">Apps are built into Birchwind. Install/remove changes your saved app collection on this browser; it does not install software onto your device.</p>
      </div>
    </div>
  );
}
