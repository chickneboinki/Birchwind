import { useEffect, useMemo, useState } from "react";
import { AudioLines, Bot, Film, Gamepad2, Globe, Home, Maximize2, Minus, Music, Settings, ShoppingBag, StickyNote, Brain, X, Search, Power, AppWindow } from "lucide-react";
import { cn } from "@/lib/utils";

type AppInfo = { id: string; title: string; path: string; icon: typeof Home; color: string };
const APPS: AppInfo[] = [
  { id: "home", title: "Home", path: "/home", icon: Home, color: "text-sky-300" },
  { id: "web", title: "Browser", path: "/web", icon: Globe, color: "text-blue-300" },
  { id: "movies", title: "Movies & TV", path: "/movies", icon: Film, color: "text-rose-300" },
  { id: "music", title: "Music", path: "/music", icon: Music, color: "text-emerald-300" },
  { id: "ai", title: "Birch AI", path: "/chat", icon: Bot, color: "text-violet-300" },
  { id: "games", title: "Games", path: "/games", icon: Gamepad2, color: "text-amber-300" },
  { id: "notes", title: "Notepad", path: "/notes", icon: StickyNote, color: "text-yellow-200" },
  { id: "voice", title: "Voice", path: "/voice", icon: AudioLines, color: "text-pink-300" },
  { id: "store", title: "App Store", path: "/store", icon: ShoppingBag, color: "text-cyan-300" },
  { id: "memory", title: "Memory", path: "/memory", icon: Brain, color: "text-indigo-300" },
  { id: "settings", title: "Settings", path: "/settings", icon: Settings, color: "text-slate-200" },
];
type WindowState = { id: number; app: AppInfo; x: number; y: number; w: number; h: number; z: number; minimized: boolean; maximized: boolean };
let nextWindowId = 1;

function initialApp(): AppInfo | undefined {
  if (typeof window === "undefined") return undefined;
  const path = window.location.pathname;
  if (path === "/" || path === "/home") return undefined;
  return APPS.find((a) => path === a.path || path.startsWith(a.path + "/"));
}

export function DesktopWorkspace() {
  const [windows, setWindows] = useState<WindowState[]>(() => {
    const app = initialApp();
    return app ? [{ id: nextWindowId++, app, x: 100, y: 44, w: 900, h: 610, z: 2, minimized: false, maximized: false }] : [];
  });
  const [nextZ, setNextZ] = useState(3);
  const [startOpen, setStartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const [drag, setDrag] = useState<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const active = useMemo(() => windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0]?.id, [windows]);
  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 15000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setWindows((old) => old.map((w) => w.id === drag.id && !w.maximized ? { ...w, x: Math.max(0, Math.min(window.innerWidth - 260, drag.left + e.clientX - drag.x)), y: Math.max(0, Math.min(window.innerHeight - 120, drag.top + e.clientY - drag.y)) } : w));
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag]);
  const openApp = (app: AppInfo) => {
    const existing = windows.find((w) => w.app.id === app.id && !w.minimized);
    if (existing) {
      setWindows((old) => old.map((w) => w.id === existing.id ? { ...w, z: nextZ } : w));
      setNextZ((z) => z + 1);
      setStartOpen(false);
      return;
    }
    const id = nextWindowId++;
    setWindows((old) => [...old, { id, app, x: Math.max(16, 80 + old.length * 28), y: Math.max(16, 35 + old.length * 24), w: Math.min(980, Math.max(340, window.innerWidth - 90)), h: Math.min(680, Math.max(300, window.innerHeight - 130)), z: nextZ, minimized: false, maximized: false }]);
    setNextZ((z) => z + 1);
    setStartOpen(false);
  };
  const focus = (id: number) => { setWindows((old) => old.map((w) => w.id === id ? { ...w, z: nextZ, minimized: false } : w)); setNextZ((z) => z + 1); };
  const filteredApps = APPS.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));
  return <div className="windows-shell relative h-dvh w-full select-none overflow-hidden bg-[#0b1827] text-white">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_22%,rgba(31,112,170,.38),transparent_42%),radial-gradient(ellipse_at_78%_78%,rgba(26,95,109,.32),transparent_42%),linear-gradient(135deg,#081421,#122b40_52%,#07111d)]" />
    <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:44px_44px]" />
    <div className="absolute left-4 top-4 z-10 grid grid-cols-1 gap-2">
      {APPS.filter((a) => a.id !== "home").map((app) => { const Icon = app.icon; return <button key={app.id} onClick={() => openApp(app)} className="desktop-app-icon flex w-[82px] flex-col items-center gap-1 rounded-lg p-2 text-center text-[11px] text-white/90 hover:bg-white/10 focus:bg-white/15"><span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-lg backdrop-blur"><Icon className={cn("size-6", app.color)} /></span><span className="rounded px-1 py-0.5 drop-shadow-md">{app.title}</span></button>; })}
    </div>
    {windows.map((w) => {
      const Icon = w.app.icon;
      const style = w.maximized ? { left: 8, top: 8, width: "calc(100% - 16px)", height: "calc(100% - 64px)", zIndex: w.z } : { left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z };
      return <section key={w.id} onPointerDown={() => focus(w.id)} style={style} className={cn("desktop-window absolute flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/25 bg-[#f3f4f6] text-slate-900 shadow-[0_24px_90px_rgba(0,0,0,.48)]", w.minimized && "hidden")}>
        <header onPointerDown={(e) => { if ((e.target as HTMLElement).closest("button")) return; setDrag({ id: w.id, x: e.clientX, y: e.clientY, left: w.x, top: w.y }); focus(w.id); }} className="flex h-11 shrink-0 cursor-move items-center gap-2 border-b border-black/10 bg-white/95 px-3">
          <Icon className={cn("size-4", w.app.color)} /><span className="min-w-0 flex-1 truncate text-xs font-medium">{w.app.title}</span>
          <button title="Minimize" onClick={() => setWindows((old) => old.map((x) => x.id === w.id ? { ...x, minimized: true } : x))} className="flex h-9 w-10 items-center justify-center hover:bg-slate-200"><Minus className="size-4" /></button>
          <button title={w.maximized ? "Restore" : "Maximize"} onClick={() => setWindows((old) => old.map((x) => x.id === w.id ? { ...x, maximized: !x.maximized } : x))} className="flex h-9 w-10 items-center justify-center hover:bg-slate-200"><Maximize2 className="size-3.5" /></button>
          <button title="Close" onClick={() => setWindows((old) => old.filter((x) => x.id !== w.id))} className="flex h-9 w-11 items-center justify-center hover:bg-red-500 hover:text-white"><X className="size-4" /></button>
        </header>
        <div className="min-h-0 flex-1 bg-background"><iframe title={w.app.title} src={w.app.path + (w.app.path.includes("?") ? "&" : "?") + "window=1"} className="size-full border-0 bg-background" allow="autoplay; fullscreen; clipboard-read; clipboard-write" /></div>
      </section>;
    })}
    {startOpen && <div className="windows-start-panel absolute bottom-[70px] left-1/2 z-[1000] w-[min(92vw,520px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/20 bg-[#172536]/95 p-4 shadow-2xl backdrop-blur-2xl">
      <label className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2"><Search className="size-4 text-white/60" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search apps" className="w-full bg-transparent text-sm outline-none placeholder:text-white/50" /></label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{filteredApps.map((app) => { const Icon = app.icon; return <button key={app.id} onClick={() => openApp(app)} className="flex flex-col items-center gap-2 rounded-xl p-3 text-xs hover:bg-white/10"><span className="flex size-11 items-center justify-center rounded-xl bg-white/10"><Icon className={cn("size-5", app.color)} /></span>{app.title}</button>; })}</div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/60"><span>Birchwind desktop</span><button onClick={() => { window.location.href = "/auth"; }} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10"><Power className="size-3.5" /> Sign out</button></div>
    </div>}
    <footer className="windows-taskbar absolute inset-x-0 bottom-0 z-[1100] flex h-[58px] items-center justify-between border-t border-white/15 bg-[#101d2b]/80 px-3 shadow-[0_-8px_32px_rgba(0,0,0,.16)] backdrop-blur-2xl">
      <div className="flex min-w-0 items-center gap-2"><button onClick={() => setStartOpen((x) => !x)} className={cn("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-300 to-blue-600 shadow-lg transition hover:brightness-110", startOpen && "ring-2 ring-white/70")} title="Start"><AppWindow className="size-5 text-white" /></button><button onClick={() => openApp(APPS[1]!)} className="hidden rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/15 sm:flex"><Search className="mr-2 inline size-3.5" /> Search apps</button></div>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-2">{windows.map((w) => { const Icon = w.app.icon; return <button key={w.id} onClick={() => w.minimized ? focus(w.id) : active === w.id ? setWindows((old) => old.map((x) => x.id === w.id ? { ...x, minimized: true } : x)) : focus(w.id)} title={w.app.title} className={cn("relative flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-white/10", active === w.id && "bg-white/15")}><Icon className={cn("size-[18px]", w.app.color)} />{active === w.id && <span className="absolute bottom-0.5 h-0.5 w-4 rounded-full bg-sky-300" />}</button>; })}</div>
      <button onClick={() => setStartOpen((x) => !x)} className="shrink-0 rounded-lg px-2 py-1 text-right text-[11px] leading-4 hover:bg-white/10"><span className="block">{clock.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span><span className="block text-white/60">{clock.toLocaleDateString([], { month: "numeric", day: "numeric" })}</span></button>
    </footer>
  </div>;
}
