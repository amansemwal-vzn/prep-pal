import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { usePersistentState, uid, todayKey } from "@/lib/storage";
import { JOB_COLUMNS, type Job, type JobStatus, type JobsData } from "@/lib/types";
import { Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/jobs")({
  head: () => ({ meta: [{ title: "Job Tracker — Forge" }] }),
  component: JobsPage,
});

const COLUMN_ACCENT: Record<JobStatus, string> = {
  Applied: "from-blue-400/30 to-blue-400/0",
  Ghosted: "from-zinc-400/30 to-zinc-400/0",
  "Round 1 Cleared": "from-amber-400/30 to-amber-400/0",
  "Interview Stage": "from-orange-400/40 to-orange-400/0",
  "Offer Received": "from-emerald-400/40 to-emerald-400/0",
  Rejected: "from-red-500/40 to-red-500/0",
};

function JobsPage() {
  const [jobs, setJobs] = usePersistentState<JobsData>("jobs", []);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<Omit<Job, "id" | "status">>({
    company: "", role: "", appliedDate: todayKey(), notes: "",
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<JobStatus | null>(null);

  const add = () => {
    if (!draft.company.trim()) return;
    setJobs((p) => [...p, { id: uid(), status: "Applied", ...draft }]);
    setDraft({ company: "", role: "", appliedDate: todayKey(), notes: "" });
    setShowAdd(false);
  };

  const move = (id: string, status: JobStatus) =>
    setJobs((p) => p.map((j) => (j.id === id ? { ...j, status } : j)));
  const remove = (id: string) => setJobs((p) => p.filter((j) => j.id !== id));

  return (
    <div>
      <PageHeader
        title="Job Tracker"
        subtitle="Pipeline at a glance. Drag cards across the funnel."
        right={
          <button
            onClick={() => setShowAdd(true)}
            className="ember-bg text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition shadow-[var(--shadow-glow)]"
          >
            <Plus className="h-4 w-4" /> Add company
          </button>
        }
      />

      <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-4 overflow-x-auto pb-4">
        {JOB_COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col);
          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={() => {
                if (draggingId) move(draggingId, col);
                setDraggingId(null); setOverCol(null);
              }}
              className={`glass rounded-2xl p-3 flex flex-col min-h-[400px] transition ${
                overCol === col ? "ring-2 ring-primary/50" : ""
              }`}
            >
              <div className={`relative rounded-xl px-3 py-2 mb-3 bg-gradient-to-r ${COLUMN_ACCENT[col]}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{col}</h3>
                  <span className="text-xs text-muted-foreground tabular-nums">{colJobs.length}</span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {colJobs.map((j) => (
                  <div
                    key={j.id}
                    draggable
                    onDragStart={() => setDraggingId(j.id)}
                    onDragEnd={() => { setDraggingId(null); setOverCol(null); }}
                    className={`group rounded-xl p-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 hover:border-primary/30 cursor-grab active:cursor-grabbing transition ${
                      draggingId === j.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{j.company}</div>
                        <div className="text-xs text-muted-foreground truncate">{j.role || "—"}</div>
                      </div>
                      <button
                        onClick={() => remove(j.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {j.notes && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{j.notes}</p>}
                    <div className="mt-2 text-[10px] font-mono text-muted-foreground">{j.appliedDate}</div>
                    <div className="mt-2 md:hidden">
                      <select
                        value={j.status}
                        onChange={(e) => move(j.id, e.target.value as JobStatus)}
                        className="w-full bg-white/5 border border-white/10 rounded-md text-xs px-2 py-1"
                      >
                        {JOB_COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {colJobs.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-6">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="glass-strong rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Add application</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Company">
                <input
                  autoFocus
                  value={draft.company}
                  onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Role">
                <input
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Date applied">
                <input
                  type="date"
                  value={draft.appliedDate}
                  onChange={(e) => setDraft({ ...draft, appliedDate: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Notes">
                <textarea
                  rows={3}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  className="input resize-none"
                />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={add}
                className="ember-bg text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: inherit;
          outline: none;
          transition: border-color .2s;
        }
        .input:focus { border-color: rgba(239,68,68,0.5); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
