import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ReactNode } from "react";
import { RefreshCw, Search, LayoutGrid, Palette, Sparkles, Globe, ShieldCheck, Bot, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { getModelStatus } from "@/lib/astra/status.functions";
import { supabase } from "@/integrations/supabase/client";
import { MobileMenuButton } from "@/components/astra/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACCENTS, PALETTES, resetPrefs, setPrefs, usePrefs, type Prefs } from "@/lib/astra/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — BirchBlock" }] }),
  component: SettingsPage,
});

const TABS = ["Layout", "Appearance", "Essences", "Proxy", "Privacy", "AI"] as const;
type TabName = (typeof TABS)[number];

const UA_GROUPS: Record<string, string[]> = {
  Desktop: ["Chrome · Windows", "Chrome · macOS", "Safari · macOS", "Firefox · Windows", "Edge · Windows"],
  Mobile: ["Safari · iPhone", "Safari · iPad", "Chrome · Android"],
  TV: ["Google TV / Chromecast", "YouTube TV (Cobalt)", "Samsung TV (Tizen)", "LG TV (webOS)", "Amazon Fire TV", "Apple TV (tvOS)"],
  Console: ["PlayStation 5", "Xbox Series X", "Nintendo Switch"],
  Other: ["Googlebot", "Bingbot"],
};

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        {desc && <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="label-mono">{title}</h2>
      <div className="mt-2 divide-y rounded-lg border bg-card/40">{children}</div>
    </section>
  );
}

function Choice<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string; sub?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2 p-3 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn("rounded-md border px-3 py-2.5 text-left transition", value === o.v ? "border-star bg-accent" : "hover:bg-accent/50")}
        >
          <div className="text-sm font-medium">{o.label}</div>
          {o.sub && <div className="text-xs text-muted-foreground">{o.sub}</div>}
        </button>
      ))}
    </div>
  );
}

function SettingsPage() {
  const p = usePrefs();
  const [tab, setTab] = useState<TabName>("Layout");
  const [settingsSearch, setSettingsSearch] = useState("");
  const set = (x: Partial<Prefs>) => setPrefs(x);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex h-12 items-center px-3 md:hidden"><MobileMenuButton /></header>
      <div className="windows-settings mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-4 md:flex-row md:gap-8 md:px-8 md:py-7">
        <aside className="windows-settings-nav w-full shrink-0 md:w-64">
          <div className="mb-4 flex items-center gap-3 px-2">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-500"><Settings2 className="size-6" /></span>
            <div><div className="text-lg font-semibold tracking-tight">Settings</div><div className="text-xs text-muted-foreground">Birchwind system</div></div>
          </div>
          <label className="mb-4 flex items-center gap-2 rounded-xl border bg-background/75 px-3 py-2.5 shadow-sm">
            <Search className="size-4 text-muted-foreground" />
            <input value={settingsSearch} onChange={(e) => setSettingsSearch(e.target.value)} placeholder="Find a setting" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            
          </label>
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {TABS.filter((t) => !settingsSearch.trim() || t.toLowerCase().includes(settingsSearch.toLowerCase())).map((t) => {
              const Icon = t === "Layout" ? LayoutGrid : t === "Appearance" ? Palette : t === "Essences" ? Sparkles : t === "Proxy" ? Globe : t === "Privacy" ? ShieldCheck : Bot;
              return <button key={t} onClick={() => setTab(t)} className={cn("flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition", tab === t ? "bg-sky-500/12 font-medium text-sky-600 dark:text-sky-300" : "text-muted-foreground hover:bg-accent hover:text-foreground")}><Icon className="size-[18px]" />{t === "Essences" ? "Personalization" : t === "Proxy" ? "Network & browser" : t === "AI" ? "AI & accounts" : t}</button>;
            })}
          </nav>
          {settingsSearch && !TABS.some((t) => t.toLowerCase().includes(settingsSearch.toLowerCase())) && <p className="px-3 py-3 text-xs text-muted-foreground">No categories match “{settingsSearch}”. Try appearance, privacy, proxy, or AI.</p>}
          <div className="mt-5 hidden rounded-2xl border bg-card/70 p-3 md:block"><div className="text-xs font-medium">Birchwind is up to date</div><div className="mt-1 text-xs text-muted-foreground">Your preferences save as you change them.</div></div>
        </aside>
        <main className="min-w-0 flex-1 pb-8">
          <div className="windows-settings-heading mb-5 flex items-center justify-between gap-4 rounded-2xl border bg-card/65 px-5 py-4">
            <div><p className="text-xs font-medium uppercase tracking-[.16em] text-sky-600 dark:text-sky-300">System preferences</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{tab === "Essences" ? "Personalization" : tab === "Proxy" ? "Network & browser" : tab === "AI" ? "AI & accounts" : tab}</h1><p className="mt-1 text-sm text-muted-foreground">Make Birchwind feel like your own desktop.</p></div>
            <Button variant="outline" size="sm" onClick={() => { resetPrefs(); toast("Settings reset"); }}>Reset all</Button>
          </div>

        {tab === "Layout" && (
          <>
            <Card title="App layout">
              <Choice
                value={p.layout}
                onChange={(layout) => set({ layout })}
                options={[
                  { v: "classic", label: "Classic", sub: "Full sidebar with chats list" },
                  { v: "launcher", label: "Launcher", sub: "Icon rail, address bar & home screen" },
                ]}
              />
            </Card>
            <Card title="Desktop experience">
              <Choice
                value={p.desktopMode ?? "windows"}
                onChange={(desktopMode) => set({ desktopMode })}
                options={[
                  { v: "windows", label: "Windows desktop", sub: "Desktop icons, floating windows, and taskbar" },
                  { v: "ps5", label: "Console · PS5 style", sub: "Controller-friendly, cinematic dashboard" },
                  { v: "xbox", label: "Console · Xbox style", sub: "Dashboard tiles and quick app access" },
                ]}
              />
            </Card>
            <Card title="Dashboard layout">
              <Row title="Choose your desktop" desc="Switch the whole desktop between Windows and console-style layouts."><span className="text-xs text-muted-foreground">{p.desktopMode === "ps5" ? "PS5-inspired" : p.desktopMode === "xbox" ? "Xbox-inspired" : "Windows"}</span></Row>
              <div className="grid gap-2 p-3 sm:grid-cols-3">
                {([{v:"windows",label:"Windows",sub:"Floating windows and desktop icons"},{v:"ps5",label:"PS5 style",sub:"Cinematic blue console dashboard"},{v:"xbox",label:"Xbox style",sub:"Green dashboard and quick launch"}] as const).map((mode) => <button key={mode.v} onClick={() => set({desktopMode:mode.v})} className={cn("rounded-xl border p-3 text-left transition hover:-translate-y-0.5",p.desktopMode===mode.v?"border-sky-500 bg-sky-500/10 ring-1 ring-sky-500/30":"hover:bg-accent")}><div className="font-medium">{mode.label}</div><div className="mt-1 text-xs text-muted-foreground">{mode.sub}</div>{p.desktopMode===mode.v&&<div className="mt-2 text-xs font-medium text-sky-600">Current layout</div>}</button>)}
              </div>
              <div className="px-4 pb-2 pt-3"><div className="text-sm font-medium">Your 3 dashboard apps</div><p className="mt-1 text-xs text-muted-foreground">Choose exactly three apps to feature on PS5 and Xbox-style dashboards. Your choice is saved automatically.</p></div>
              <div className="grid gap-2 p-3 sm:grid-cols-2">
                {([{id:"web",label:"Browser"},{id:"movies",label:"Movies & TV"},{id:"music",label:"Music"},{id:"ai",label:"Birch AI"},{id:"games",label:"Games"},{id:"notes",label:"Notepad"},{id:"voice",label:"Voice"},{id:"store",label:"App Store"},{id:"memory",label:"Memory"},{id:"settings",label:"Settings"}] as const).map((app) => { const selected=(p.dashboardApps ?? ["web","games","music"]).includes(app.id); return <button key={app.id} onClick={() => { const current=p.dashboardApps ?? ["web","games","music"]; if(selected){if(current.length>1)set({dashboardApps:current.filter((id)=>id!==app.id)});}else if(current.length<3)set({dashboardApps:[...current,app.id]}); else toast("Choose up to three apps. Remove one first."); }} className={cn("flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition",selected?"border-sky-500 bg-sky-500/10":"hover:bg-accent")}><span>{app.label}</span><span className={cn("flex size-5 items-center justify-center rounded-md border text-xs",selected?"border-sky-500 bg-sky-500 text-white":"text-muted-foreground")}>{selected?"✓":""}</span></button>; })}
              </div>
              <Row title="Selected apps" desc="Exactly three slots are recommended for the console dashboard."><span className="text-xs tabular-nums">{(p.dashboardApps ?? ["web","games","music"]).length} / 3</span></Row>
              <div className="flex flex-wrap gap-2 p-3"><Button variant="outline" size="sm" onClick={() => {set({desktopMode:"windows",dashboardApps:["web","games","music"],performanceMode:"balanced",reduceMotion:false});toast("Restored the default desktop layout");}}>Restore default layout</Button><Button variant="outline" size="sm" onClick={() => {set({desktopMode:"ps5",dashboardApps:["web","games","music"]});toast("PS5-style layout applied");}}>PS5 preset</Button><Button variant="outline" size="sm" onClick={() => {set({desktopMode:"xbox",dashboardApps:["games","music","movies"]});toast("Xbox-style layout applied");}}>Xbox preset</Button></div>
            </Card>
            <Card title="Performance">
              <Choice
                value={p.performanceMode ?? "balanced"}
                onChange={(performanceMode) => set({ performanceMode })}
                options={[
                  { v: "performance", label: "Performance", sub: "Less blur, fewer effects, faster response" },
                  { v: "balanced", label: "Balanced", sub: "Smooth motion with moderate effects" },
                  { v: "quality", label: "Visual quality", sub: "Richer transparency and desktop effects" },
                ]}
              />
              <Row title="Reduce motion" desc="Disable decorative animations for comfort or extra responsiveness."><Switch checked={p.reduceMotion} onCheckedChange={(reduceMotion) => set({ reduceMotion })} /></Row>
            </Card>
            <Card title="Home screen">
              <Row title="Title"><Input className="w-44" value={p.homeName} onChange={(e) => set({ homeName: e.target.value })} /></Row>
              <Row title="Tagline"><Input className="w-56" value={p.tagline} onChange={(e) => set({ tagline: e.target.value })} /></Row>
              <Row title="Show clock"><Switch checked={p.showClock} onCheckedChange={(showClock) => set({ showClock })} /></Row>
            </Card>
            <Card title="Browsing">
              <Row title="Search engine" desc="BirchBlock keeps results inside the app; others open in a new tab.">
                <Select value={p.searchEngine} onValueChange={(v) => set({ searchEngine: v as Prefs["searchEngine"] })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="astra">BirchBlock</SelectItem>
                    <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="bing">Bing</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
              <Row title="Open websites in a new tab"><Switch checked={p.openLinksInNewTab} onCheckedChange={(openLinksInNewTab) => set({ openLinksInNewTab })} /></Row>
            </Card>
          </>
        )}

        {tab === "Appearance" && <Appearance p={p} set={set} />}

        {tab === "Essences" && (
          <>
            <Card title="Background">
              <Choice
                value={p.background}
                onChange={(background) => set({ background })}
                options={[
                  { v: "plain", label: "Plain" },
                  { v: "dots", label: "Dot grid" },
                  { v: "grid", label: "Lines" },
                  { v: "glow", label: "Accent glow" },
                ]}
              />
            </Card>
            <Card title="Effects">
              <Row title="Glowing home title"><Switch checked={p.glowTitle} onCheckedChange={(glowTitle) => set({ glowTitle })} /></Row>
              <Row title="Reduce motion" desc="Turns off animations everywhere."><Switch checked={p.reduceMotion} onCheckedChange={(reduceMotion) => set({ reduceMotion })} /></Row>
            </Card>
          </>
        )}

        {tab === "Proxy" && (
          <>
            <Card title="Proxy">
              <Row title="Proxy websites" desc="Route the Web tab through your proxy server."><Switch checked={p.proxyEnabled} onCheckedChange={(proxyEnabled) => set({ proxyEnabled })} /></Row>
              <Row title="Proxy games" desc="Route games through Scramjet. Doesn't apply to cloud or emulated games."><Switch checked={p.proxyGames} onCheckedChange={(proxyGames) => set({ proxyGames })} /></Row>
              <Row title="Wisp server" desc="Only used by Epoxy and Libcurl. If no Wisp server is reachable, BirchBlock relay is used automatically.">
                <Input className="w-56" placeholder="wss://your-wisp/" value={p.wisp} onChange={(e) => set({ wisp: e.target.value })} />
              </Row>
            </Card>
            <Card title="Transport">
              <Choice value={p.transport} onChange={(transport) => set({ transport })} options={[
                { v: "astra", label: "BirchBlock relay", sub: "through BirchBlock's server · works on school wifi" },
                { v: "epoxy", label: "Epoxy", sub: "slim TLS · needs Wisp" },
                { v: "libcurl", label: "Libcurl", sub: "OpenSSL TLS · fallback" },
              ]} />
            </Card>
            <Card title="Browser identity">
              <Choice value={p.identity} onChange={(identity) => set({ identity })} options={[
                { v: "mirror", label: "Mirror", sub: "real · coherent" },
                { v: "disguise", label: "Disguise", sub: "synthetic · coherent" },
              ]} />
            </Card>
            <Card title="User agent">
              <Row title="Sent with every proxied request" desc="Sites often serve a lighter page to TVs and consoles.">
                <Select value={p.userAgent} onValueChange={(userAgent) => set({ userAgent })}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    {Object.entries(UA_GROUPS).map(([g, list]) => (
                      <SelectGroup key={g}>
                        <SelectLabel>{g}</SelectLabel>
                        {list.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            </Card>
            <p className="mt-3 text-xs text-muted-foreground">Powered by Scramjet. Leave the Wisp server empty to use the default public server.</p>
          </>
        )}

        {tab === "Privacy" && (
          <Card title="Stealth">
            <Row title="Tab cloak" desc="Disguise the browser tab title."><Switch checked={p.tabCloak} onCheckedChange={(tabCloak) => set({ tabCloak })} /></Row>
            <Row title="Cloak title"><Input className="w-44" value={p.cloakTitle} onChange={(e) => set({ cloakTitle: e.target.value })} /></Row>
            <Row title="Panic key" desc="Press it anywhere to leave instantly."><Input className="w-20 text-center" maxLength={1} value={p.panicKey} onChange={(e) => set({ panicKey: e.target.value })} /></Row>
            <Row title="Panic website"><Input className="w-56" value={p.panicUrl} onChange={(e) => set({ panicUrl: e.target.value })} /></Row>
          </Card>
        )}

        {tab === "AI" && <AISettings />}
        </main>
      </div>
    </div>
  );
}

function Appearance({ p, set }: { p: Prefs; set: (x: Partial<Prefs>) => void }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light"), []);
  function applyTheme(t: "dark" | "light") {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("astra-theme", t);
  }
  return (
    <>
      <Card title="Theme">
        <Row title="Mode">
          <div className="inline-flex rounded-md border p-0.5">
            {(["dark", "light"] as const).map((t) => (
              <button key={t} onClick={() => applyTheme(t)} className={cn("rounded px-4 py-1.5 text-sm capitalize", theme === t ? "bg-accent text-foreground" : "text-muted-foreground")}>{t}</button>
            ))}
          </div>
        </Row>
        <Row title="Color theme">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PALETTES) as Prefs["palette"][]).map((k) => (
              <button key={k} onClick={() => set({ palette: k, accent: "star" })} className={cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm", p.palette === k ? "border-star bg-accent" : "hover:bg-accent/50")}>
                <span className="flex">{PALETTES[k].swatch.map((c) => <span key={c} className="-ml-1 size-4 rounded-full border first:ml-0" style={{ background: c }} />)}</span>
                {PALETTES[k].name}
              </button>
            ))}
          </div>
        </Row>
        <Row title="Accent color">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ACCENTS) as Prefs["accent"][]).map((a) => (
              <button
                key={a}
                aria-label={a}
                onClick={() => set({ accent: a })}
                className={cn("size-6 rounded-full border-2", p.accent === a ? "border-foreground" : "border-transparent", a === "star" && "bg-star")}
                style={ACCENTS[a] ? { background: ACCENTS[a] } : undefined}
              />
            ))}
          </div>
        </Row>
      </Card>
      <Card title="Size & shape">
        <Row title={`Text size · ${p.fontScale}%`}><Slider className="w-40" min={85} max={125} step={5} value={[p.fontScale]} onValueChange={([v]) => set({ fontScale: v ?? 100 })} /></Row>
        <Row title={`Corner roundness · ${p.radius.toFixed(2)}`}><Slider className="w-40" min={0} max={1.2} step={0.1} value={[p.radius]} onValueChange={([v]) => set({ radius: v ?? 0.3 })} /></Row>
        <Row title="Density">
          <div className="inline-flex rounded-md border p-0.5">
            {(["compact", "comfortable"] as const).map((d) => (
              <button key={d} onClick={() => set({ density: d })} className={cn("rounded px-3 py-1.5 text-sm capitalize", p.density === d ? "bg-accent text-foreground" : "text-muted-foreground")}>{d}</button>
            ))}
          </div>
        </Row>
      </Card>
    </>
  );
}

function AISettings() {
  const fetchStatus = useServerFn(getModelStatus);
  const { data, isFetching, refetch } = useQuery({ queryKey: ["model-status"], queryFn: () => fetchStatus() });
  const { data: usage } = useQuery({
    queryKey: ["usage-today"],
    queryFn: async () => {
      const since = new Date();
      since.setUTCHours(0, 0, 0, 0);
      const { data } = await supabase.from("usage_events").select("units, input_tokens, output_tokens").gte("created_at", since.toISOString());
      return (data ?? []).reduce(
        (a, r) => ({ units: a.units + Number(r.units), tokens: a.tokens + r.input_tokens + r.output_tokens, n: a.n + 1 }),
        { units: 0, tokens: 0, n: 0 },
      );
    },
  });
  const { data: tools } = useQuery({
    queryKey: ["tools"],
    queryFn: async () => (await supabase.from("tools").select("*").order("sort_order")).data ?? [],
  });
  return (
    <>
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="label-mono">Model server</h2>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} /> Check
          </Button>
        </div>
        <div className="mt-2 divide-y rounded-lg border">
          {data?.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn("size-2 rounded-full", m.reachable ? "bg-success" : m.configured ? "bg-destructive" : "bg-muted-foreground")} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.detail}{m.modelName ? ` · ${m.modelName}` : ""}</div>
              </div>
            </div>
          ))}
          {!data && <div className="px-4 py-3 text-sm text-muted-foreground">Checking…</div>}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="label-mono">Usage today</h2>
        <div className="mt-2 rounded-lg border p-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl">{(usage?.units ?? 0).toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">/ 500 units</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-star" style={{ width: `${Math.min(100, ((usage?.units ?? 0) / 500) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{usage?.n ?? 0} replies · {(usage?.tokens ?? 0).toLocaleString()} tokens. Resets at midnight UTC.</p>
        </div>
      </section>
      <Card title="Tools">
        {tools?.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={cn("size-2 rounded-full", t.enabled ? "bg-success" : "bg-muted-foreground")} />
            <div className="flex-1">
              <div className="text-sm">{t.display_name}</div>
              <div className="text-xs text-muted-foreground">{t.description}</div>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
