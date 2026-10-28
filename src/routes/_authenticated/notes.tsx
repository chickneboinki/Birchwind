import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Search, Trash2, Pin, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "Notes — Birchwind" }] }),
  component: Notes,
});

type Note = { id: string; title: string; body: string; updatedAt: number; pinned?: boolean };
const KEY = "birchwind-notes-v1";
const makeNote = (): Note => ({ id: crypto.randomUUID(), title: "Untitled note", body: "", updatedAt: Date.now() });

function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]") as Note[];
      setNotes(saved);
      setActiveId(saved[0]?.id || "");
    } catch { setNotes([]); }
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(notes)); }, [notes, ready]);

  const active = notes.find((n) => n.id === activeId);
  const filtered = useMemo(() => notes.filter((n) => (n.title + " " + n.body).toLowerCase().includes(query.toLowerCase())).sort((a,b) => Number(Boolean(b.pinned))-Number(Boolean(a.pinned)) || b.updatedAt-a.updatedAt), [notes, query]);

  function patch(p: Partial<Note>) { setNotes((all) => all.map((n) => n.id === activeId ? { ...n, ...p, updatedAt: Date.now() } : n)); }
  function add() { const n = makeNote(); setNotes((all) => [n, ...all]); setActiveId(n.id); }
  function remove(id: string) { const rest = notes.filter((n) => n.id !== id); setNotes(rest); if (activeId === id) setActiveId(rest[0]?.id || ""); }

  return <div className="flex h-full min-h-0 bg-background">
    <aside className="flex w-64 shrink-0 flex-col border-r bg-card/70 sm:w-72">
      <div className="flex items-center gap-2 border-b p-4"><FileText className="size-5 text-primary" /><div className="flex-1"><h1 className="font-semibold">Notes</h1><p className="text-xs text-muted-foreground">{notes.length} saved notes</p></div><button onClick={add} className="rounded-lg bg-primary p-2 text-primary-foreground" aria-label="Create note"><Plus className="size-4" /></button></div>
      <label className="m-3 flex items-center gap-2 rounded-lg border bg-background px-3 py-2"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search notes" className="w-full bg-transparent text-sm outline-none" /></label>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">{filtered.map((n)=><button key={n.id} onClick={()=>setActiveId(n.id)} className={cn("mb-1 block w-full rounded-xl border p-3 text-left",activeId===n.id?"border-primary/50 bg-primary/5":"border-transparent hover:bg-accent")}>
        <div className="flex items-center gap-2"><span className="truncate text-sm font-medium">{n.title||"Untitled note"}</span>{n.pinned&&<Pin className="size-3 shrink-0 text-primary" />}</div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body||"No additional text"}</p><span className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground"><Clock3 className="size-3" />{new Date(n.updatedAt).toLocaleString()}</span>
      </button>)}</div>
      <div className="border-t p-3 text-[11px] text-muted-foreground">Saved on this device in this browser.</div>
    </aside>
    <main className="flex min-w-0 flex-1 flex-col">{active ? <>
      <div className="flex items-center gap-2 border-b px-4 py-3 sm:px-7"><span className="flex-1 text-xs text-muted-foreground">Auto-saved note</span><button onClick={()=>patch({pinned:!active.pinned})} className={cn("rounded-lg border px-3 py-2 text-xs",active.pinned&&"bg-primary/10 text-primary")}><Pin className="mr-1 inline size-3" />{active.pinned?"Pinned":"Pin"}</button><button onClick={()=>remove(active.id)} className="rounded-lg border p-2 text-muted-foreground hover:text-destructive" aria-label="Delete note"><Trash2 className="size-4" /></button></div>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-5 py-8 sm:px-10"><input value={active.title} onChange={(e)=>patch({title:e.target.value})} placeholder="Note title" className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50" /><textarea value={active.body} onChange={(e)=>patch({body:e.target.value})} placeholder="Start writing…" className="min-h-0 flex-1 resize-none bg-transparent text-base leading-7 outline-none placeholder:text-muted-foreground/60" /><div className="text-right text-xs text-muted-foreground">{active.body.trim()?active.body.trim().split(/\s+/).length:0} words</div></div>
    </> : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary"><FileText className="size-8" /></div><h2 className="text-xl font-semibold">Your ideas, in one place</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">Create a note to save a thought, list, or reminder.</p><button onClick={add} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"><Plus className="size-4" /> New note</button></div>}</main>
  </div>;
}
