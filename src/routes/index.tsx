import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { usePersistentState, todayKey } from "@/lib/storage";
import { Flame, CheckCircle2, Circle, Briefcase, NotebookPen, ListChecks } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { DailyTask, RoadmapsData, JobsData, Note } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Forge" }] }),
  component: DashboardPage,
});

function calcStreak(tasks: DailyTask[]): number {
  const days = new Set(tasks.filter((t) => t.completed).map((t) => t.date));
  let streak = 0;
  const d = new Date();
  while (days.has(todayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  // allow today to be empty without breaking streak (check yesterday)
  if (streak === 0) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    while (days.has(todayKey(y))) {
      streak++;
      y.setDate(y.getDate() - 1);
    }
  }
  return streak;
}

function DashboardPage() {
  const [tasks] = usePersistentState<DailyTask[]>("tasks", []);
  const [roadmaps] = usePersistentState<RoadmapsData>("roadmaps", []);
  const [jobs] = usePersistentState<JobsData>("jobs", []);
  const [notes] = usePersistentState<Note[]>("notes", []);
  const [range, setRange] = useState<7 | 30>(7);

  const completedInRange = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range + 1);
    cutoff.setHours(0, 0, 0, 0);
    return tasks.filter((t) => t.completed && new Date(t.date) >= cutoff).length;
  }, [tasks, range]);

  const streak = useMemo(() => calcStreak(tasks), [tasks]);

  // 91-day heatmap (13 weeks)
  const heatmap = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.completed) counts.set(t.date, (counts.get(t.date) ?? 0) + 1);
    });
    const days: { date: string; count: number }[] = [];
    const d = new Date();
    d.setDate(d.getDate() - 90);
    for (let i = 0; i < 91; i++) {
      const k = todayKey(d);
      days.push({ date: k, count: counts.get(k) ?? 0 });
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [tasks]);

  const heatColor = (c: number) => {
    if (c === 0) return "bg-white/[0.04]";
    if (c === 1) return "bg-primary/30";
    if (c === 2) return "bg-primary/55";
    if (c <= 4) return "bg-primary/80";
    return "bg-accent";
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your prep at a glance — momentum, milestones, and what's next."
        right={
          <div className="glass rounded-xl p-1 flex">
            {[7, 30].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r as 7 | 30)}
                className={`px-3 py-1.5 text-xs rounded-lg transition ${
                  range === r ? "ember-bg text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={`Tasks · ${range}d`} value={completedInRange} icon={<ListChecks className="h-4 w-4" />} />
        <StatCard label="Current streak" value={`${streak}d`} icon={<Flame className="h-4 w-4 text-primary" />} highlight />
        <StatCard label="Applications" value={jobs.length} icon={<Briefcase className="h-4 w-4" />} />
        <StatCard label="Notes" value={notes.length} icon={<NotebookPen className="h-4 w-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Activity — last 91 days</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>Less</span>
              {[0, 1, 2, 4, 6].map((c) => (
                <span key={c} className={`h-2.5 w-2.5 rounded-sm ${heatColor(c)}`} />
              ))}
              <span>More</span>
            </div>
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-2">
            {heatmap.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} tasks`}
                className={`h-3.5 w-3.5 rounded-sm ${heatColor(d.count)} hover:ring-2 hover:ring-primary/60 transition`}
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4">Roadmaps</h3>
          {roadmaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No roadmaps yet.{" "}
              <Link to="/roadmaps" className="text-primary hover:underline">Create one →</Link>
            </p>
          ) : (
            <div className="space-y-4">
              {roadmaps.map((rm) => {
                const total = rm.topics.length;
                const done = rm.topics.filter((t) => t.done).length;
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={rm.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium truncate">{rm.name}</span>
                      <span className="text-muted-foreground tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full ember-bg transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: React.ReactNode; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-5 transition hover:translate-y-[-2px] ${highlight ? "border-primary/30" : ""}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={`mt-2 text-3xl font-bold tabular-nums ${highlight ? "ember-text" : ""}`}>
        {value}
      </div>
    </div>
  );
}
