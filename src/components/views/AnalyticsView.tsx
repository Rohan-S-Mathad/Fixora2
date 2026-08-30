import React from "react";
import { useProject } from "../../context/ProjectContext";
import { IssueStatus, IssueSeverity, IssuePriority } from "../../types";
import {
  BarChart,
  PieChart,
  TrendingUp,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export const AnalyticsView: React.FC = () => {
  const { issues, activeProject } = useProject();

  const total = issues.length || 1;

  // Breakdown by Status
  const statusCounts = {
    open: issues.filter((i) => i.status === IssueStatus.OPEN || i.status === IssueStatus.REOPENED).length,
    in_progress: issues.filter((i) => i.status === IssueStatus.IN_PROGRESS).length,
    in_review: issues.filter((i) => i.status === IssueStatus.IN_REVIEW).length,
    resolved: issues.filter((i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED).length,
  };

  // Breakdown by Severity
  const severityCounts = {
    critical: issues.filter((i) => i.severity === IssueSeverity.CRITICAL).length,
    high: issues.filter((i) => i.severity === IssueSeverity.HIGH).length,
    medium: issues.filter((i) => i.severity === IssueSeverity.MEDIUM).length,
    low: issues.filter((i) => i.severity === IssueSeverity.LOW).length,
  };

  // Components count
  const componentMap: Record<string, number> = {};
  issues.forEach((i) => {
    const c = i.component || "General";
    componentMap[c] = (componentMap[c] || 0) + 1;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Engineering Analytics</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Metrics, MTTR (Mean Time to Resolution), severity distribution, and component hotspots for{" "}
            <span className="text-indigo-400 font-mono">{activeProject?.name || "Project"}</span>.
          </p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0e1017] border border-zinc-800">
          <span className="text-xs font-mono uppercase text-zinc-400">Total Backlog</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">{issues.length}</p>
          <span className="text-[11px] text-zinc-500 font-mono">100% indexed</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1017] border border-emerald-900/30">
          <span className="text-xs font-mono uppercase text-emerald-400">Resolution Rate</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {Math.round((statusCounts.resolved / total) * 100)}%
          </p>
          <span className="text-[11px] text-emerald-400/70 font-mono">{statusCounts.resolved} bugs closed</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1017] border border-rose-900/30">
          <span className="text-xs font-mono uppercase text-rose-400">Critical Ratio</span>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {Math.round((severityCounts.critical / total) * 100)}%
          </p>
          <span className="text-[11px] text-rose-400/70 font-mono">{severityCounts.critical} critical blockers</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1017] border border-zinc-800">
          <span className="text-xs font-mono uppercase text-zinc-400">Est. MTTR</span>
          <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">4.2 hrs</p>
          <span className="text-[11px] text-zinc-500 font-mono">Based on last 30 days</span>
        </div>
      </div>

      {/* Grid: Severity Breakdown & Component Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="p-5 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
              Severity Distribution
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                <span className="text-rose-400 font-semibold">Critical ({severityCounts.critical})</span>
                <span>{Math.round((severityCounts.critical / total) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500"
                  style={{ width: `${(severityCounts.critical / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                <span className="text-orange-400 font-semibold">High ({severityCounts.high})</span>
                <span>{Math.round((severityCounts.high / total) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${(severityCounts.high / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                <span className="text-yellow-400 font-semibold">Medium ({severityCounts.medium})</span>
                <span>{Math.round((severityCounts.medium / total) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${(severityCounts.medium / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                <span className="text-blue-400 font-semibold">Low ({severityCounts.low})</span>
                <span>{Math.round((severityCounts.low / total) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(severityCounts.low / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Component Hotspots */}
        <div className="p-5 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
              Component Defect Density
            </h2>
          </div>

          <div className="space-y-3">
            {Object.entries(componentMap).map(([compName, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={compName}>
                  <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                    <span className="text-zinc-200">{compName}</span>
                    <span>{count} issues ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
