import { useEffect, useMemo, useState } from "react";
import { AudioLines, Bot, Film, Gamepad2, Globe, Home, Maximize2, Minus, Music, Settings, ShoppingBag, StickyNote, Brain, X, Search, Power, AppWindow } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefs } from "@/lib/astra/prefs";

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
type WindowState = { id: number; app: AppInfo; src?: string; x: number; y: number; w: number; h: number; z: number; minimized: boolean; maximized: boolean };
let nextWindowId = 1;

function initialApp(): AppInfo | undefined {
  if (typeof window === "undefined") return undefined;
  const path = window.location.pathname;
  if (path === "/" || path === "/home") return undefined;
  return APPS.find((a) => path === a.path || path.startsWith(a.path + "/"));
}

export function DesktopWorkspace() {
  const prefs = usePrefs();
  const [windows, setWindows] = useState<WindowState[]>(() => {
    const app = initialApp();
    return app ? [{ id: nextWindowId++, app, x: 100, y: 44, w: 900, h: 610, z: 2, minimized: false, maximized: false }] : [];
  });
  const [nextZ, setNextZ] = useState(3);
  const [startOpen, setStartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const [drag, setDrag] = useState<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const [resize, setResize] = useState<{ id: number; edge: string; x: number; y: number; left: number; top: number; w: number; h: number } | null>(null);
  const active = useMemo(() => windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0]?.id, [windows]);
  useEffect(() => {
    document.documentElement.dataset.desktopMode = prefs.desktopMode ?? "windows";
    document.documentElement.dataset.performance = prefs.performanceMode ?? "balanced";
    document.documentElement.classList.toggle("reduce-motion", prefs.reduceMotion);
  }, [prefs.desktopMode, prefs.performanceMode, prefs.reduceMotion]);
  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 15000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (!drag && !resize) return;
    const move = (e: PointerEvent) => {
      if (drag) setWindows((old) => old.map((w) => w.id === drag.id && !w.maximized ? { ...w, x: Math.max(0, Math.min(window.innerWidth - 260, drag.left + e.clientX - drag.x)), y: Math.max(0, Math.min(window.innerHeight - 120, drag.top + e.clientY - drag.y)) } : w));
      if (resize) setWindows((old) => old.map((w) => {
        if (w.id !== resize.id || w.maximized) return w;
        const dx=e.clientX-resize.x, dy=e.clientY-resize.y;
        let x=resize.left, y=resize.top, width=resize.w, height=resize.h;
        if (resize.edge.includes("e")) width=Math.max(340,resize.w+dx);
        if (resize.edge.includes("s")) height=Math.max(260,resize.h+dy);
        if (resize.edge.includes("w")) { width=Math.max(340,resize.w-dx); x=resize.left+resize.w-width; }
        if (resize.edge.includes("n")) { height=Math.max(260,resize.h-dy); y=resize.top+resize.h-height; }
        return {...w,x:Math.max(0,x),y:Math.max(0,y),w:Math.min(window.innerWidth,width),h:Math.min(window.innerHeight-58,height)};
      }));
    };
    const up = (e: PointerEvent) => {
      if (drag && e.clientY < 12) setWindows((old) => old.map((w) => w.id===drag.id ? {...w,maximized:true}:w));
      else if (drag && e.clientX < 12) setWindows((old) => old.map((w) => w.id===drag.id ? {...w,x:8,y:8,w:Math.floor(window.innerWidth/2)-12,h:window.innerHeight-82,maximized:false}:w));
      else if (drag && e.clientX > window.innerWidth-12) setWindows((old) => old.map((w) => w.id===drag.id ? {...w,x:Math.floor(window.innerWidth/2),y:8,w:Math.floor(window.innerWidth/2)-8,h:window.innerHeight-82,maximized:false}:w));
      setDrag(null); setResize(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag, resize]);
  const openApp = (app: AppInfo, query?: string) => {
    const targetSrc = app.path + (query ? `?q=${encodeURIComponent(query)}&window=1` : "?window=1");
    const existing = windows.find((w) => w.app.id === app.id && !w.minimized);
    if (existing) {
      setWindows((old) => old.map((w) => w.id === existing.id ? { ...w, z: nextZ, ...(query ? { src: targetSrc } : {}) } : w));
      setNextZ((z) => z + 1);
      setStartOpen(false);
      return;
    }
    const id = nextWindowId++;
    setWindows((old) => [...old, { id, app, src: targetSrc, x: Math.max(16, 80 + old.length * 28), y: Math.max(16, 35 + old.length * 24), w: Math.min(980, Math.max(340, window.innerWidth - 90)), h: Math.min(680, Math.max(300, window.innerHeight - 130)), z: nextZ, minimized: false, maximized: false }]);
    setNextZ((z) => z + 1);
    setStartOpen(false);
  };
  const focus = (id: number) => { setWindows((old) => old.map((w) => w.id === id ? { ...w, z: nextZ, minimized: false } : w)); setNextZ((z) => z + 1); };
  const filteredApps = APPS.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));
  return <div data-desktop-mode={prefs.desktopMode ?? "windows"} data-performance={prefs.performanceMode ?? "balanced"} className={cn("windows-shell relative h-dvh w-full select-none overflow-hidden bg-[#0b1827] text-white", prefs.reduceMotion && "reduce-motion")}>
    <div className={cn("absolute inset-0 transition-colors duration-500", prefs.desktopMode === "ps5" ? "bg-[radial-gradient(ellipse_at_50%_0%,rgba(58,130,246,.6),transparent_58%),linear-gradient(145deg,#071329,#173b70_55%,#060d1c)]" : prefs.desktopMode === "xbox" ? "bg-[radial-gradient(ellipse_at_82%_18%,rgba(80,220,120,.34),transparent_48%),linear-gradient(145deg,#07140d,#173b2a_55%,#061009)]" : "bg-[radial-gradient(ellipse_at_18%_22%,rgba(31,112,170,.38),transparent_42%),radial-gradient(ellipse_at_78%_78%,rgba(26,95,109,.32),transparent_42%),linear-gradient(135deg,#081421,#122b40_52%,#07111d)]")} />
    {(prefs.desktopMode ?? "windows") === "windows" && <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:44px_44px]" />}
    {(prefs.desktopMode ?? "windows") === "windows" && <div className="absolute left-4 top-4 z-10 grid grid-cols-1 gap-2">
      {APPS.filter((a) => a.id !== "home").map((app) => { const Icon = app.icon; return <button key={app.id} onClick={() => openApp(app)} className="desktop-app-icon flex w-[82px] flex-col items-center gap-1 rounded-lg p-2 text-center text-[11px] text-white/90 hover:bg-white/10 focus:bg-white/15"><span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-lg backdrop-blur"><Icon className={cn("size-6", app.color)} /></span><span className="rounded px-1 py-0.5 drop-shadow-md">{app.title}</span></button>; })}
    </div>}
    {(prefs.desktopMode === "ps5" || prefs.desktopMode === "xbox") && windows.length === 0 && <main className="absolute inset-x-0 top-[18%] z-10 mx-auto w-[min(1100px,92vw)] animate-in fade-in slide-in-from-bottom-3 duration-500"><p className="mb-2 text-sm font-medium uppercase tracking-[.28em] text-white/65">{prefs.desktopMode === "ps5" ? "Play · Discover · Connect" : "Jump back in"}</p><h1 className="mb-7 text-4xl font-semibold tracking-tight sm:text-6xl">{prefs.desktopMode === "ps5" ? "Welcome back." : "What are we playing?"}</h1><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{APPS.filter((a) => a.id !== "home").map((app, index) => { const Icon=app.icon; return <button key={app.id} onClick={() => openApp(app)} className={cn("group flex min-h-32 flex-col justify-between rounded-2xl border border-white/15 p-4 text-left shadow-xl transition duration-200 hover:-translate-y-1 hover:scale-[1.015] hover:border-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300", prefs.desktopMode === "ps5" ? "bg-gradient-to-br from-blue-400/25 to-indigo-950/70" : "bg-gradient-to-br from-emerald-400/20 to-[#0b2115]/90", index === 0 && "sm:col-span-2 sm:row-span-2 sm:min-h-64")}><Icon className={cn("size-6",app.color)} /><span><span className="block text-base font-semibold">{app.title}</span><span className="mt-1 block text-xs text-white/55">Open {app.title}</span></span></button>; })}</div></main>}
    {windows.map((w) => {
      const Icon = w.app.icon;
      const style = w.maximized ? { left: 8, top: 8, width: "calc(100% - 16px)", height: "calc(100% - 64px)", zIndex: w.z } : { left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z };
      return <section key={w.id} onPointerDown={() => focus(w.id)} style={style} className={cn("desktop-window absolute flex min-h-0 flex-col overflow-hidden border border-white/25 bg-[#f3f4f6] text-slate-900 shadow-[0_24px_90px_rgba(0,0,0,.48)]", prefs.desktopMode === "windows" ? "rounded-xl" : "rounded-2xl", w.minimized && "hidden")}>
        <header onPointerDown={(e) => { if ((e.target as HTMLElement).closest("button")) return; setDrag({ id: w.id, x: e.clientX, y: e.clientY, left: w.x, top: w.y }); focus(w.id); }} className={cn("flex h-11 shrink-0 cursor-move items-center gap-2 border-b border-black/10 px-3", prefs.desktopMode === "windows" ? "bg-white/95" : prefs.desktopMode === "ps5" ? "bg-[#101f3a] text-white" : "bg-[#102719] text-white")}>
          <Icon className={cn("size-4", w.app.color)} /><span className="min-w-0 flex-1 truncate text-xs font-medium">{w.app.title}</span>
          <button title="Minimize" onClick={() => setWindows((old) => old.map((x) => x.id === w.id ? { ...x, minimized: true } : x))} className="flex h-9 w-10 items-center justify-center hover:bg-slate-200"><Minus className="size-4" /></button>
          <button title={w.maximized ? "Restore" : "Maximize"} onClick={() => setWindows((old) => old.map((x) => x.id === w.id ? { ...x, maximized: !x.maximized } : x))} className="flex h-9 w-10 items-center justify-center hover:bg-slate-200"><Maximize2 className="size-3.5" /></button>
          <button title="Close" onClick={() => setWindows((old) => old.filter((x) => x.id !== w.id))} className="flex h-9 w-11 items-center justify-center hover:bg-red-500 hover:text-white"><X className="size-4" /></button>
        </header>
        {!w.maximized && <>{["n","s","e","w","ne","nw","se","sw"].map((edge) => <div key={edge} onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); focus(w.id); setResize({id:w.id,edge,x:e.clientX,y:e.clientY,left:w.x,top:w.y,w:w.w,h:w.h}); }} className={cn("window-resize-handle", `resize-${edge}`)} />)}</>}
        <div className="min-h-0 flex-1 bg-background"><iframe title={w.app.title} src={w.src ?? (w.app.path + "?window=1")} className="size-full border-0 bg-background" allow="autoplay; fullscreen; clipboard-read; clipboard-write" /></div>
      </section>;
    })}
    {startOpen && <div className="windows-start-panel absolute bottom-[70px] left-1/2 z-[1000] w-[min(92vw,520px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/20 bg-[#172536]/95 p-4 shadow-2xl backdrop-blur-2xl">
      <form onSubmit={(e) => { e.preventDefault(); const q = search.trim(); if (!q) return; const match = APPS.find((a) => a.title.toLowerCase() === q.toLowerCase() || a.title.toLowerCase().includes(q.toLowerCase())); if (match) openApp(match); else openApp(APPS.find((a) => a.id === "web")!, q); }} className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 focus-within:border-sky-300/60"><Search className="size-4 shrink-0 text-white/60" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search apps, settings, or the web" className="w-full bg-transparent text-sm outline-none placeholder:text-white/50" /><kbd className="hidden rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/50 sm:inline">↵</kbd></form>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{filteredApps.map((app) => { const Icon = app.icon; return <button key={app.id} onClick={() => openApp(app)} className="flex flex-col items-center gap-2 rounded-xl p-3 text-xs hover:bg-white/10"><span className="flex size-11 items-center justify-center rounded-xl bg-white/10"><Icon className={cn("size-5", app.color)} /></span>{app.title}</button>; })}</div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/60"><span>Birchwind desktop</span><button onClick={() => { window.location.href = "/auth"; }} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10"><Power className="size-3.5" /> Sign out</button></div>
    </div>}
    <footer className={cn("windows-taskbar absolute inset-x-0 bottom-0 z-[1100] flex h-[58px] items-center justify-between border-t border-white/15 px-3 shadow-[0_-8px_32px_rgba(0,0,0,.16)] backdrop-blur-2xl", prefs.desktopMode === "ps5" ? "bg-[#08152b]/90" : prefs.desktopMode === "xbox" ? "bg-[#07190e]/90" : "bg-[#101d2b]/80")}>
      <div className="flex min-w-0 items-center gap-2"><button onClick={() => setStartOpen((x) => !x)} className={cn("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-300 to-blue-600 shadow-lg transition hover:brightness-110", startOpen && "ring-2 ring-white/70")} title="Start"><AppWindow className="size-5 text-white" /></button><button onClick={() => { setStartOpen(true); setSearch(""); }} className="hidden rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/15 sm:flex"><Search className="mr-2 inline size-3.5" /> Search apps and web</button></div>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-2">{windows.map((w) => { const Icon = w.app.icon; return <button key={w.id} onClick={() => w.minimized ? focus(w.id) : active === w.id ? setWindows((old) => old.map((x) => x.id === w.id ? { ...x, minimized: true } : x)) : focus(w.id)} title={w.app.title} className={cn("relative flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-white/10", active === w.id && "bg-white/15")}><Icon className={cn("size-[18px]", w.app.color)} />{active === w.id && <span className="absolute bottom-0.5 h-0.5 w-4 rounded-full bg-sky-300" />}</button>; })}</div>
      <button onClick={() => setStartOpen((x) => !x)} className="shrink-0 rounded-lg px-2 py-1 text-right text-[11px] leading-4 hover:bg-white/10"><span className="block">{clock.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span><span className="block text-white/60">{clock.toLocaleDateString([], { month: "numeric", day: "numeric" })}</span></button>
    </footer>
  </div>;
}
