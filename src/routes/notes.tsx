import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { usePersistentState, uid, todayKey } from "@/lib/storage";
import { NOTE_TAGS, type Note, type NoteTag } from "@/lib/types";
import { Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Notes — Forge" }] }),
  component: NotesPage,
});

const TAG_COLORS: Record<NoteTag, string> = {
  DSA: "bg-primary/20 text-primary border-primary/30",
  CN: "bg-accent/20 text-accent border-accent/30",
  OOPS: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  SD: "bg-violet-400/15 text-violet-300 border-violet-400/30",
};

function NotesPage() {
  const [notes, setNotes] = usePersistentState<Note[]>("notes", []);
  const [filter, setFilter] = useState<NoteTag | "All">("All");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<{ title: string; body: string; tag: NoteTag }>({
    title: "", body: "", tag: "DSA",
  });

  const filtered = useMemo(() => {
    const list = filter === "All" ? notes : notes.filter((n) => n.tag === filter);
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [notes, filter]);

  const add = () => {
    if (!draft.title.trim() && !draft.body.trim()) return;
    setNotes((p) => [
      { id: uid(), title: draft.title.trim() || "Untitled", body: draft.body.trim(), tag: draft.tag, date: todayKey() },
      ...p,
    ]);
    setDraft({ title: "", body: "", tag: "DSA" });
    setShowAdd(false);
  };
  const remove = (id: string) => setNotes((p) => p.filter((n) => n.id !== id));

  return (
    <div>
      <PageHeader
        title="Quick Notes"
        subtitle="Capture insights. Revisit before interviews."
        right={
          <button
            onClick={() => setShowAdd(true)}
            className="ember-bg text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition shadow-[var(--shadow-glow)]"
          >
            <Plus className="h-4 w-4" /> New note
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {(["All", ...NOTE_TAGS] as const).map((t) => {
          const active = filter === t;
          const count = t === "All" ? notes.length : notes.filter((n) => n.tag === t).length;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                active
                  ? "ember-bg text-white border-transparent shadow-[var(--shadow-glow)]"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              {t} <span className="opacity-60 ml-1 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center text-muted-foreground">
          {notes.length === 0 ? "No notes yet. Capture your first concept." : "No notes for this tag."}
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n) => (
            <GlassCard key={n.id} className="p-5 group hover:border-primary/30 transition">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${TAG_COLORS[n.tag]}`}>
                  {n.tag}
                </span>
                <button
                  onClick={() => remove(n.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <h3 className="font-semibold leading-snug">{n.title}</h3>
              {n.body && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{n.body}</p>}
              <div className="mt-3 text-[10px] font-mono text-muted-foreground">{n.date}</div>
            </GlassCard>
          ))}
        </div>
      )}

      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAdd(false)}
        >
          <div className="glass-strong rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">New note</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Title"
                className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <textarea
                rows={6}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Capture the concept, gotchas, formula..."
                className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm outline-none resize-none font-mono"
              />
              <div className="flex gap-2 flex-wrap">
                {NOTE_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setDraft({ ...draft, tag: t })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      draft.tag === t
                        ? "ember-bg text-white border-transparent"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={add}
                className="ember-bg text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
