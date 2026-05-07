import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { usePersistentState, uid } from "@/lib/storage";
import type { Roadmap, RoadmapsData } from "@/lib/types";
import { Plus, Trash2, ChevronDown, ChevronRight, Check } from "lucide-react";

export const Route = createFileRoute("/roadmaps")({
  head: () => ({ meta: [{ title: "Roadmaps — Forge" }] }),
  component: RoadmapsPage,
});

function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = usePersistentState<RoadmapsData>("roadmaps", []);
  const [name, setName] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const addRoadmap = () => {
    const n = name.trim();
    if (!n) return;
    const id = uid();
    setRoadmaps((p) => [...p, { id, name: n, topics: [] }]);
    setOpenIds((s) => new Set(s).add(id));
    setName("");
  };
  const removeRoadmap = (id: string) => setRoadmaps((p) => p.filter((r) => r.id !== id));

  const addTopic = (rid: string, tname: string) => {
    if (!tname.trim()) return;
    setRoadmaps((p) =>
      p.map((r) => (r.id === rid ? { ...r, topics: [...r.topics, { id: uid(), name: tname.trim(), done: false }] } : r))
    );
  };
  const toggleTopic = (rid: string, tid: string) =>
    setRoadmaps((p) =>
      p.map((r) =>
        r.id === rid ? { ...r, topics: r.topics.map((t) => (t.id === tid ? { ...t, done: !t.done } : t)) } : r
      )
    );
  const removeTopic = (rid: string, tid: string) =>
    setRoadmaps((p) =>
      p.map((r) => (r.id === rid ? { ...r, topics: r.topics.filter((t) => t.id !== tid) } : r))
    );

  const toggleOpen = (id: string) =>
    setOpenIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const overall = (() => {
    const all = roadmaps.flatMap((r) => r.topics);
    if (!all.length) return 0;
    return Math.round((all.filter((t) => t.done).length / all.length) * 100);
  })();

  return (
    <div>
      <PageHeader
        title="Roadmaps"
        subtitle="Map your prep. Track every topic. Close the gaps."
        right={
          <div className="glass rounded-xl px-4 py-2 text-sm">
            <span className="text-muted-foreground mr-2">Overall</span>
            <span className="font-bold ember-text tabular-nums">{overall}%</span>
          </div>
        }
      />

      <GlassCard className="p-5 mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRoadmap()}
          placeholder="New roadmap (e.g. Striver A2Z DSA, System Design)"
          className="flex-1 bg-white/5 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-2.5 text-sm outline-none transition"
        />
        <button
          onClick={addRoadmap}
          className="ember-bg text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" /> Add roadmap
        </button>
      </GlassCard>

      {roadmaps.length === 0 ? (
        <GlassCard className="p-10 text-center text-muted-foreground">
          No roadmaps yet. Create one above to start tracking.
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {roadmaps.map((rm) => (
            <RoadmapCard
              key={rm.id}
              roadmap={rm}
              open={openIds.has(rm.id)}
              onToggleOpen={() => toggleOpen(rm.id)}
              onAddTopic={(t) => addTopic(rm.id, t)}
              onToggleTopic={(tid) => toggleTopic(rm.id, tid)}
              onRemoveTopic={(tid) => removeTopic(rm.id, tid)}
              onRemove={() => removeRoadmap(rm.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoadmapCard({
  roadmap, open, onToggleOpen, onAddTopic, onToggleTopic, onRemoveTopic, onRemove,
}: {
  roadmap: Roadmap; open: boolean; onToggleOpen: () => void;
  onAddTopic: (t: string) => void; onToggleTopic: (id: string) => void;
  onRemoveTopic: (id: string) => void; onRemove: () => void;
}) {
  const [topic, setTopic] = useState("");
  const total = roadmap.topics.length;
  const done = roadmap.topics.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <GlassCard className="overflow-hidden">
      <div className="p-5 flex items-center gap-4">
        <button onClick={onToggleOpen} className="text-muted-foreground hover:text-foreground transition">
          {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-semibold truncate">{roadmap.name}</h3>
            <span className="text-xs text-muted-foreground tabular-nums">{done}/{total} · {pct}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full ember-bg transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive transition"
          aria-label="Delete roadmap"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          <div className="flex gap-2 mb-3">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { onAddTopic(topic); setTopic(""); }
              }}
              placeholder="Add topic / milestone"
              className="flex-1 bg-white/5 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={() => { onAddTopic(topic); setTopic(""); }}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {roadmap.topics.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No topics yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {roadmap.topics.map((t) => (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition"
                >
                  <button
                    onClick={() => onToggleTopic(t.id)}
                    className={`h-4 w-4 rounded border flex items-center justify-center transition ${
                      t.done ? "ember-bg border-transparent" : "border-white/20 hover:border-primary"
                    }`}
                  >
                    {t.done && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>
                    {t.name}
                  </span>
                  <button
                    onClick={() => onRemoveTopic(t.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </GlassCard>
  );
}
