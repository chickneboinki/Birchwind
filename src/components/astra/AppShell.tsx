import { Link, useNavigate, useParams, useRouter, useRouterState } from "@tanstack/react-router";
import { RoomFollower } from "@/components/RoomFollower";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Bot, Brain, Film, Gamepad2, Globe, AudioLines, Home, Lock, LogOut, Maximize, Music, Shield, Menu, MessageSquare, Plus, RotateCw, Search, Settings, Trash2, ShoppingBag, StickyNote, PanelsTopLeft, Clock3, Wifi, Bluetooth, Moon, Sun, Plane, BatteryFull, Volume2, Power, X } from "lucide-react";
import { usePrefs } from "@/lib/astra/prefs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { threadsQuery } from "@/lib/astra/data";
import { AstraWordmark } from "./Mark";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const ShellCtx = createContext<{ openMenu: () => void; openCommand: () => void }>({
  openMenu: () => {},
  openCommand: () => {},
});
export const useShell = () => useContext(ShellCtx);

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        navigate({ to: "/chat" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const prefs = usePrefs();
  useEffect(() => {
    const onPanic = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (prefs.panicKey && e.key === prefs.panicKey) window.location.href = prefs.panicUrl;
    };
    window.addEventListener("keydown", onPanic);
    return () => window.removeEventListener("keydown", onPanic);
  }, [prefs.panicKey, prefs.panicUrl]);
  useEffect(() => {
    if (!prefs.tabCloak) return;
    const t = setInterval(() => { if (document.title !== prefs.cloakTitle) document.title = prefs.cloakTitle; }, 500);
    return () => clearInterval(t);
  }, [prefs.tabCloak, prefs.cloakTitle]);

  const launcher = prefs.layout === "launcher";

  return (
    <ShellCtx.Provider value={{ openMenu: () => setMobileOpen(true), openCommand: () => setCmdOpen(true) }}>
      <div className="windows-shell flex h-dvh overflow-hidden bg-background">
        {launcher ? (
          <IconRail onSearch={() => setCmdOpen(true)} />
        ) : (
          <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex">
            <SidebarBody onNavigate={() => {}} onSearch={() => setCmdOpen(true)} />
          </aside>
        )}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[82vw] max-w-72 border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarBody
              onNavigate={() => setMobileOpen(false)}
              onSearch={() => {
                setMobileOpen(false);
                setCmdOpen(true);
              }}
            />
          </SheetContent>
        </Sheet>
        <main className="windows-main flex min-w-0 flex-1 flex-col">
          {launcher && <TopBar />}
          <div className="min-h-0 flex-1 overflow-hidden"><RoomFollower />{children}</div>
          <DesktopTaskbar onSearch={() => setCmdOpen(true)} />
        </main>
      </div>
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </ShellCtx.Provider>
  );
}


function DesktopTaskbar({ onSearch }: { onSearch: () => void }) {
  const [startOpen, setStartOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [airplane, setAirplane] = useState(false);
  const [night, setNight] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  const [volume, setVolume] = useState(68);
  const [brightness, setBrightness] = useState(82);
  const [now, setNow] = useState(() => new Date());
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 15000); return () => window.clearInterval(id); }, []);
  useEffect(() => {
    const update = (e: Event) => { const detail = (e as CustomEvent<string[]>).detail; if (Array.isArray(detail)) setInstalledApps(detail); else { try { setInstalledApps(JSON.parse(localStorage.getItem("birchwind-installed-apps") || "[]")); } catch { setInstalledApps([]); } } };
    window.addEventListener("birchwind:apps-changed", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("birchwind:apps-changed", update); window.removeEventListener("storage", update); };
  }, []);
  useEffect(() => { setStartOpen(false); setQuickOpen(false); }, [path]);
  const open = (to: (typeof RAIL)[number]["to"]) => navigate({ to });
  const tile = (label: string, icon: ReactNode, active: boolean, toggle: () => void) => <button key={label} onClick={toggle} aria-pressed={active} className={cn("flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition", active ? "border-primary/30 bg-primary text-primary-foreground" : "bg-background hover:bg-accent")}><span>{icon}</span><span className="text-xs font-medium">{label}</span></button>;
  return <div className="windows-taskbar relative z-40 flex h-[58px] shrink-0 items-center justify-between gap-2 border-t px-3">
    <div className="flex min-w-0 items-center gap-2">
      <button onClick={() => { setStartOpen(!startOpen); setQuickOpen(false); }} aria-label="Open Start" className={cn("windows-start-button flex size-10 items-center justify-center rounded-xl",startOpen&&"bg-accent")}><PanelsTopLeft className="size-5" /></button>
      <button onClick={onSearch} className="hidden items-center gap-2 rounded-full border bg-background/60 px-3 py-2 text-xs text-muted-foreground sm:flex"><Search className="size-3.5" /> Search apps, chats, and the web</button>
    </div>
    <nav aria-label="Pinned apps" className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto">
      {RAIL.filter((a) => a.id === "store" || a.id === "home" || installedApps.includes(a.id)).map((app) => { const Icon = app.icon; return <button key={app.to} onClick={() => open(app.to)} title={app.label} aria-label={app.label} className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-accent",path===app.to&&"bg-accent text-primary")}><Icon className="size-[18px]" /></button>; })}
    </nav>
    <div className="relative flex shrink-0 items-center gap-1">
      <button onClick={() => { setQuickOpen(!quickOpen); setStartOpen(false); }} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-accent" aria-label="Quick settings"><Wifi className="size-4" /><Volume2 className="size-4" /><BatteryFull className="size-4" /></button>
      <button onClick={() => { setQuickOpen(!quickOpen); setStartOpen(false); }} className="hidden rounded-lg px-2 py-1 text-right text-[11px] leading-4 hover:bg-accent sm:block"><span className="block">{now.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</span><span className="block text-muted-foreground">{now.toLocaleDateString([], {month:"numeric",day:"numeric",year:"numeric"})}</span></button>
      {startOpen && <div className="absolute bottom-[64px] left-0 z-50 w-[min(92vw,560px)] rounded-2xl border bg-card p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Start</h2><p className="text-xs text-muted-foreground">Pinned Birchwind apps</p></div><button onClick={onSearch} className="rounded-lg border px-3 py-2 text-xs"><Search className="mr-1 inline size-3" /> Search</button></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{RAIL.filter((app) => app.id === "store" || app.id === "home" || installedApps.includes(app.id)).map((app) => { const Icon=app.icon; return <button key={app.to} onClick={() => open(app.to)} className="flex flex-col items-center gap-2 rounded-xl p-3 text-xs hover:bg-accent"><span className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="size-5" /></span><span>{app.label}</span></button>; })}</div><div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span>Birchwind</span><button onClick={() => supabase.auth.signOut()} className="rounded-lg px-3 py-2 hover:bg-accent"><Power className="mr-1 inline size-3" /> Sign out</button></div></div>}
      {quickOpen && <div className="absolute bottom-[64px] right-0 z-50 w-[min(92vw,360px)] rounded-2xl border bg-card p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Quick settings</h2><button onClick={() => setQuickOpen(false)} aria-label="Close quick settings" className="rounded-lg p-1 hover:bg-accent"><X className="size-4" /></button></div><div className="grid grid-cols-2 gap-2">{tile("Wi-Fi",<Wifi className="size-4" />,wifi,()=>setWifi(!wifi))}{tile("Bluetooth",<Bluetooth className="size-4" />,bluetooth,()=>setBluetooth(!bluetooth))}{tile("Airplane mode",<Plane className="size-4" />,airplane,()=>setAirplane(!airplane))}{tile("Night light",<Moon className="size-4" />,night,()=>setNight(!night))}{tile("Battery saver",<BatteryFull className="size-4" />,batterySaver,()=>setBatterySaver(!batterySaver))}{tile("Light mode",<Sun className="size-4" />,!night,()=>setNight(!night))}</div><div className="mt-4 space-y-4 rounded-xl border p-3"><label className="flex items-center gap-3 text-sm"><Volume2 className="size-4" /><span className="w-20">Volume</span><input className="min-w-0 flex-1 accent-primary" type="range" min="0" max="100" value={volume} onChange={(e)=>setVolume(Number(e.target.value))}/><span className="w-8 text-right text-xs">{volume}%</span></label><label className="flex items-center gap-3 text-sm"><Sun className="size-4" /><span className="w-20">Brightness</span><input className="min-w-0 flex-1 accent-primary" type="range" min="20" max="100" value={brightness} onChange={(e)=>setBrightness(Number(e.target.value))}/><span className="w-8 text-right text-xs">{brightness}%</span></label></div><p className="mt-3 text-[11px] text-muted-foreground">These controls change Birchwind's interface only, not your device's hardware radios or system volume.</p></div>}
    </div>
  </div>;
}

const RAIL = [
  { id: "home", to: "/home", label: "Home", icon: Home },
  { id: "ai", to: "/chat", label: "AI", icon: Bot },
  { id: "voice", to: "/voice", label: "Voice", icon: AudioLines },
  { id: "web", to: "/web", label: "Web", icon: Globe },
  { id: "movies", to: "/movies", label: "Movies", icon: Film },
  { id: "music", to: "/music", label: "Music", icon: Music },
  { id: "games", to: "/games", label: "Games", icon: Gamepad2 },
  { id: "notes", to: "/notes", label: "Notes", icon: StickyNote },
  { id: "store", to: "/store", label: "App Store", icon: ShoppingBag },
] as const;

function IconRail({ onSearch }: { onSearch: () => void }) {
  const railLink = "flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground";
  const active = { className: "bg-sidebar-accent text-star" };
  return (
    <aside className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-3 md:flex">
      {RAIL.filter((r) => r.id === "store" || r.id === "home" || installedApps.includes(r.id)).map((r) => (
        <Link key={r.to} to={r.to} title={r.label} aria-label={r.label} className={railLink} activeProps={active}>
          <r.icon className="size-4" />
        </Link>
      ))}
      <button onClick={onSearch} title="Search" aria-label="Search" className={railLink}><Search className="size-4" /></button>
      <div className="mt-auto flex flex-col items-center gap-1 border-t border-sidebar-border pt-2">
        <Link to="/memory" title="Memory" aria-label="Memory" className={railLink} activeProps={active}><Brain className="size-4" /></Link>
        <Link to="/settings" title="Settings" aria-label="Settings" className={railLink} activeProps={active}><Settings className="size-4" /></Link>
        <button onClick={() => supabase.auth.signOut()} title="Sign out" aria-label="Sign out" className={railLink}><LogOut className="size-4" /></button>
      </div>
    </aside>
  );
}

function TopBar() {
  const navigate = useNavigate();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [q, setQ] = useState("");
  const btn = "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground";
  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-b bg-sidebar/80 px-2 backdrop-blur">
      <MobileMenuButton />
      <button className={btn} aria-label="Back" onClick={() => router.history.back()}><ArrowLeft className="size-4" /></button>
      <button className={btn} aria-label="Forward" onClick={() => router.history.forward()}><ArrowRight className="size-4" /></button>
      <button className={btn} aria-label="Reload" onClick={() => router.invalidate()}><RotateCw className="size-4" /></button>
      <form
        className="mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-background/60 px-3 py-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) navigate({ to: "/web", search: { q: q.trim() } });
          setQ("");
        }}
      >
        <Lock className="size-3 text-success" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`birchblock:/${path}`} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/80" />
      </form>
      <button className={btn} aria-label="Fullscreen" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}><Maximize className="size-4" /></button>
    </div>
  );
}

export function MobileMenuButton() {
  const { openMenu } = useShell();
  return (
    <button onClick={openMenu} className="-ml-1 rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden" aria-label="Open menu">
      <Menu className="size-5" />
    </button>
  );
}

function SidebarBody({ onNavigate, onSearch }: { onNavigate: () => void; onSearch: () => void }) {
  const { data: threads } = useQuery(threadsQuery);
  const { user } = useAuth();
  const params = useParams({ strict: false }) as { threadId?: string };
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function remove(id: string) {
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete that chat"); return; }
    qc.invalidateQueries({ queryKey: ["threads"] });
    if (params.threadId === id) navigate({ to: "/chat" });
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link to="/chat" onClick={onNavigate}>
          <AstraWordmark />
        </Link>
      </div>
      <div className="space-y-1 px-2">
        <Link
          to="/chat"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md border border-sidebar-border px-3 py-2 text-sm hover:bg-sidebar-accent"
        >
          <Plus className="size-4" /> New chat
          <kbd className="ml-auto label-mono">⇧⌘O</kbd>
        </Link>
        <button onClick={onSearch} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent">
          <Search className="size-4" /> Search
          <kbd className="ml-auto label-mono">⌘K</kbd>
        </button>
      </div>
      <div className="mt-4 space-y-0.5 px-2">
        <Link to="/home" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}><Home className="size-4" /> Home</Link>
        <Link to="/voice" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}><AudioLines className="size-4" /> Voice</Link>
        <Link to="/web" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}><Globe className="size-4" /> Web</Link>
        <Link to="/movies" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}><Film className="size-4" /> Movies</Link>
        <Link to="/music" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}><Music className="size-4" /> Music</Link>
        <Link to="/games" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}><Gamepad2 className="size-4" /> Games</Link>
      </div>
      <div className="mt-5 px-4 label-mono">AI Chats</div>
      <nav className="mt-1 flex-1 overflow-y-auto px-2 pb-2">
        {threads?.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No chats yet.</p>}
        {threads?.map((t) => (
          <div
            key={t.id}
            className={cn(
              "group flex items-center rounded-md text-sm hover:bg-sidebar-accent",
              params.threadId === t.id && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <Link
              to="/chat/$threadId"
              params={{ threadId: t.id }}
              onClick={onNavigate}
              className="min-w-0 flex-1 truncate px-3 py-2"
            >
              {t.title}
            </Link>
            <button
              onClick={() => remove(t.id)}
              className="mr-1 rounded p-1.5 text-muted-foreground opacity-100 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
              aria-label="Delete chat"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </nav>
      <div className="space-y-0.5 border-t border-sidebar-border p-2">
        <Link to="/memory" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}>
          <Brain className="size-4" /> Memory
        </Link>
        <Link to="/settings" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}>
          <Settings className="size-4" /> Settings
        </Link>
        <AdminLink onNavigate={onNavigate} />
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{user?.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="text-muted-foreground hover:text-foreground" aria-label="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: threads } = useQuery(threadsQuery);
  const navigate = useNavigate();
  const go = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search chats or jump to…" />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go(() => navigate({ to: "/chat" }))}>
            <Plus /> New chat
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/memory" }))}>
            <Brain /> Memory
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/settings" }))}>
            <Settings /> Settings
          </CommandItem>
        </CommandGroup>
        {!!threads?.length && (
          <CommandGroup heading="Chats">
            {threads.map((t) => (
              <CommandItem key={t.id} value={`${t.title} ${t.id}`} onSelect={() => go(() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } }))}>
                <MessageSquare /> {t.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function AdminLink({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { user } = useAuth();
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" })).data ?? false,
  });
  if (!isAdmin) return null;
  return (
    <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}>
      <Shield className="size-4" /> Dev dashboard
    </Link>
  );
}
