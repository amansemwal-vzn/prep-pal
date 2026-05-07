import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { usePersistentState, todayKey, uid } from "@/lib/storage";
import type { DailyTask } from "@/lib/types";
import { Plus, Trash2, Check, Flame } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Daily Tasks — Forge" }] }),
  component: TasksPage,
});

function TasksPage() {
  const [tasks, setTasks] = usePersistentState<DailyTask[]>("tasks", []);
  const [text, setText] = useState("");
  const today = todayKey();

  const todayTasks = useMemo(() => tasks.filter((t) => t.date === today), [tasks, today]);
  const done = todayTasks.filter((t) => t.completed).length;
  const total = todayTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const streak = useMemo(() => {
    const days = new Set(tasks.filter((t) => t.completed).map((t) => t.date));
    let s = 0;
    const d = new Date();
    while (days.has(todayKey(d))) { s++; d.setDate(d.getDate() - 1); }
    if (s === 0) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      while (days.has(todayKey(y))) { s++; y.setDate(y.getDate() - 1); }
    }
    return s;
  }, [tasks]);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTasks((prev) => [
      { id: uid(), text: t, date: today, completed: false, createdAt: Date.now() },
      ...prev,
    ]);
    setText("");
  };

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  // Recent days (excluding today)
  const recent = useMemo(() => {
    const map = new Map<string, DailyTask[]>();
    tasks.forEach((t) => {
      if (t.date === today) return;
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 5);
  }, [tasks, today]);

  // ring math
  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;

  return (
    <div>
      <PageHeader title="Daily Tasks" subtitle="Define today. Crush it. Repeat." />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <GlassCard className="p-6 flex items-center gap-6">
          <svg width="130" height="130" viewBox="0 0 130 130" className="shrink-0">
            <circle cx="65" cy="65" r={R} stroke="currentColor" strokeWidth="10" fill="none" className="text-white/5" />
            <circle
              cx="65" cy="65" r={R} fill="none"
              stroke="url(#emberGrad)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={offset}
              transform="rotate(-90 65 65)"
              style={{ transition: "stroke-dashoffset 600ms ease" }}
            />
            <defs>
              <linearGradient id="emberGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <text x="65" y="62" textAnchor="middle" className="fill-foreground" fontSize="22" fontWeight="700">{pct}%</text>
            <text x="65" y="82" textAnchor="middle" className="fill-muted-foreground" fontSize="10">{done}/{total} done</text>
          </svg>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Today</div>
            <div className="text-2xl font-bold mt-1">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {total === 0 ? "No tasks yet — add one." : done === total ? "Crushed it." : `${total - done} remaining`}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Current streak</div>
              <div className="text-3xl font-bold ember-text">{streak} {streak === 1 ? "day" : "days"}</div>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="e.g. Solve 3 DP problems"
              className="flex-1 bg-white/5 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm outline-none transition glow-ring"
            />
            <button
              onClick={add}
              className="ember-bg text-white px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 hover:opacity-90 transition shadow-[var(--shadow-glow)]"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Today's tasks</h3>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nothing yet. Set the bar.</p>
        ) : (
          <ul className="space-y-2">
            {todayTasks.map((t) => (
              <li
                key={t.id}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition"
              >
                <button
                  onClick={() => toggle(t.id)}
                  className={`h-5 w-5 rounded-md border flex items-center justify-center transition ${
                    t.completed ? "ember-bg border-transparent" : "border-white/20 hover:border-primary"
                  }`}
                >
                  {t.completed && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
                <span className={`flex-1 text-sm ${t.completed ? "line-through text-muted-foreground" : ""}`}>
                  {t.text}
                </span>
                <button
                  onClick={() => remove(t.id)}
                  className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {recent.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4">Recent days</h3>
          <div className="space-y-3">
            {recent.map(([date, items]) => {
              const d = items.filter((i) => i.completed).length;
              return (
                <div key={date} className="flex items-center gap-4 text-sm">
                  <span className="font-mono text-xs text-muted-foreground w-24">{date}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full ember-bg" style={{ width: `${(d / items.length) * 100}%` }} />
                  </div>
                  <span className="tabular-nums text-muted-foreground w-12 text-right">{d}/{items.length}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
