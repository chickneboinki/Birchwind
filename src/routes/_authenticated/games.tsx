import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Gamepad2, Globe, Maximize, RotateCw, Search, Sparkles } from "lucide-react";
import { MobileMenuButton } from "@/components/astra/AppShell";

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({ meta: [{ title: "Games — Birchwind" }, { name: "description", content: "Play browser games in Birchwind." }] }),
  component: Games,
});

const SERVERS = [
  { name: "GN Math", url: "https://gn-math-t.github.io/", note: "Huge unblocked game library", tag: "POPULAR", tint: "from-cyan-400/25 to-blue-500/5", icon: "🎮" },
  { name: "Lumin", url: "https://lumin-game.github.io/", note: "Quick games, right in your browser", tag: "ARCADE", tint: "from-violet-400/25 to-fuchsia-500/5", icon: "🌌" },
  { name: "CrazyGames", url: "https://www.crazygames.com/", note: "Arcade, racing and multiplayer", tag: "ARCADE", tint: "from-orange-400/25 to-rose-500/5", icon: "🕹️" },
  { name: "CloudMoon", url: "https://web.cloudmoonapp.com/", note: "Cloud gaming portal", tag: "CLOUD", tint: "from-sky-400/25 to-indigo-500/5", icon: "☁️" },
  { name: "Chicken Kings Vault", url: "https://wanocapy.github.io/ChickenKingsVault/", note: "Community game collection", tag: "COMMUNITY", tint: "from-amber-400/25 to-yellow-500/5", icon: "🐔" },
  { name: "Seraph", url: "https://seraph.reveriestudios.online/", note: "A curated game portal", tag: "DISCOVER", tint: "from-pink-400/25 to-purple-500/5", icon: "✨" },
  { name: "Truffled", url: "https://truffled.lol/", note: "Explore more browser games", tag: "DISCOVER", tint: "from-emerald-400/25 to-teal-500/5", icon: "🍄" },
  { name: "UGS", url: "https://0288007.github.io/ugs/", note: "Unblocked games collection", tag: "COMMUNITY", tint: "from-lime-400/25 to-green-500/5", icon: "🚀" },
  { name: "EmulatorJS", url: "https://demo.emulatorjs.org/", note: "Retro emulator demo — bring your own legally obtained games", tag: "RETRO", tint: "from-red-400/25 to-orange-500/5", icon: "👾" },
] as const;

type Portal = (typeof SERVERS)[number];

function Games() {
  const [query, setQuery] = useState("");
  const [portal, setPortal] = useState<Portal | null>(null);
  const [nonce, setNonce] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const shown = useMemo(() => SERVERS.filter((s) => `${s.name} ${s.note} ${s.tag}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && portal) setPortal(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [portal]);

  if (portal) return (
    <section className="bw-games flex h-full min-h-0 flex-col">
      <header className="bw-glass flex shrink-0 items-center gap-3 border-b px-3 py-2 sm:px-5">
        <button onClick={() => setPortal(null)} className="bw-icon-btn" aria-label="Back to games"><ArrowLeft className="size-4" /></button>
        <span className="grid size-9 place-items-center rounded-xl bg-white/5 text-xl">{portal.icon}</span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{portal.name}</p><p className="text-xs text-muted-foreground">Game portal</p></div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setNonce((n) => n + 1)} className="bw-icon-btn" aria-label="Reload game site"><RotateCw className="size-4" /></button>
          <button onClick={() => wrap.current?.requestFullscreen?.()} className="bw-icon-btn" aria-label="Fullscreen"><Maximize className="size-4" /></button>
          <button onClick={() => window.open(portal.url, "_blank", "noopener,noreferrer")} className="bw-icon-btn" aria-label="Open portal in new tab"><ExternalLink className="size-4" /></button>
        </div>
      </header>
      <div ref={wrap} className="relative min-h-0 flex-1 bg-[#080d18]">
        <iframe key={nonce} ref={frame} title={portal.name} src={portal.url} className="absolute inset-0 size-full border-0 bg-white" allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/65 px-3 py-1.5 text-[11px] text-white/75 backdrop-blur-md">If the site blocks embedding, use ↗ to open it separately.</div>
      </div>
    </section>
  );

  return (
    <div className="bw-games flex h-full min-h-0 flex-col overflow-y-auto">
      <header className="bw-glass sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b px-3 sm:px-5">
        <MobileMenuButton />
        <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary"><Gamepad2 className="size-[18px]" /></div>
        <h1 className="font-semibold tracking-tight">Game Center</h1>
        <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-muted-foreground sm:inline-flex">BIRCHWIND ARCADE</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> {SERVERS.length} portals</span>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-8 pt-6 sm:px-7 sm:pt-9">
        <div className="bw-games-hero relative mb-7 overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-9">
          <div className="bw-orb bw-orb-one" /><div className="bw-orb bw-orb-two" />
          <div className="relative z-[1] max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/75"><Sparkles className="size-3.5 text-cyan-300" /> YOUR ARCADE, REIMAGINED</div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Take a <span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-violet-300 bg-clip-text text-transparent">game break.</span></h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/60 sm:text-base">Pick a portal and jump into its game library. Fast launch, clean controls, no dead in-app game API.</p>
            <div className="mt-6 flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl transition focus-within:border-cyan-300/50 focus-within:ring-4 focus-within:ring-cyan-300/10">
              <Search className="size-4 shrink-0 text-white/45" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a game portal…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40" />
              {query && <button onClick={() => setQuery("")} className="text-xs text-white/50 hover:text-white">Clear</button>}
            </div>
          </div>
          <div className="bw-hero-mark" aria-hidden="true"><Gamepad2 /></div>
        </div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Discover</p><h3 className="mt-1 text-xl font-semibold tracking-tight">Choose your arcade</h3></div>
          <p className="text-xs text-muted-foreground">{shown.length} results</p>
        </div>
        {shown.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((s, i) => <button key={s.name} onClick={() => setPortal(s)} style={{ animationDelay: `${i * 45}ms` }} className={`bw-game-card group relative flex min-h-[154px] overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${s.tint} p-5 text-left animate-rise`}>
            <div className="absolute inset-0 bg-[#0b1220]/75 transition duration-300 group-hover:bg-[#0b1220]/50" />
            <div className="absolute -right-8 -top-8 size-36 rounded-full border border-white/[0.07] transition duration-500 group-hover:scale-125 group-hover:border-white/20" />
            <div className="absolute -right-2 -top-2 size-24 rounded-full border border-white/[0.07] transition duration-500 group-hover:scale-110" />
            <div className="relative z-[1] flex w-full items-start gap-4">
              <div className="bw-game-icon grid size-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.07] text-3xl shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:rotate-[-4deg] group-hover:scale-105">{s.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2"><span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-bold tracking-[0.16em] text-white/55">{s.tag}</span><ExternalLink className="ml-auto size-3.5 text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-200" /></div>
                <h4 className="truncate text-base font-semibold text-white">{s.name}</h4><p className="mt-1 text-xs leading-5 text-white/55">{s.note}</p>
              </div>
            </div>
          </button>)}
        </div> : <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center"><Globe className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No portals match “{query}”.</p><button onClick={() => setQuery("")} className="mt-3 text-sm text-cyan-300 hover:underline">Clear search</button></div>}
        <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">Game portals are third-party sites. Some may prevent in-app embedding; use the open-in-new-tab control if a portal refuses to load.</p>
      </main>
    </div>
  );
}
