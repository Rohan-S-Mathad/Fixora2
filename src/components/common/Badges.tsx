import React from "react";
import { IssueStatus, IssueSeverity, IssuePriority, IssueSource } from "../../types";
import {
  AlertCircle,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  HelpCircle,
  Sparkles,
  ShieldAlert,
  Terminal,
  CircleDot,
  Radio,
  XCircle,
} from "lucide-react";

export const StatusBadge: React.FC<{ status: IssueStatus | string; className?: string }> = ({
  status,
  className = "",
}) => {
  const norm = (status || "open").toLowerCase();
  
  switch (norm) {
    case "open":
    case "reopened":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 ${className}`}
        >
          <CircleDot className="w-3 h-3" />
          <span className="capitalize">{norm.replace("_", " ")}</span>
        </span>
      );
    case "in_progress":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}
        >
          <Clock className="w-3 h-3" />
          <span>In Progress</span>
        </span>
      );
    case "in_review":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 ${className}`}
        >
          <Radio className="w-3 h-3" />
          <span>In Review</span>
        </span>
      );
    case "resolved":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Resolved</span>
        </span>
      );
    case "closed":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60 ${className}`}
        >
          <XCircle className="w-3 h-3" />
          <span>Closed</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60 ${className}`}
        >
          <HelpCircle className="w-3 h-3" />
          <span className="capitalize">{norm}</span>
        </span>
      );
  }
};

export const SeverityBadge: React.FC<{
  severity: IssueSeverity | string;
  showIcon?: boolean;
  className?: string;
}> = ({ severity, showIcon = true, className = "" }) => {
  const norm = (severity || "medium").toLowerCase();

  switch (norm) {
    case "critical":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/25 ${className}`}
        >
          {showIcon && <Flame className="w-3 h-3 text-rose-400 shrink-0" />}
          <span>Critical</span>
        </span>
      );
    case "high":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/25 ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3 h-3 text-orange-400 shrink-0" />}
          <span>High</span>
        </span>
      );
    case "medium":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 ${className}`}
        >
          {showIcon && <AlertCircle className="w-3 h-3 text-yellow-400 shrink-0" />}
          <span>Medium</span>
        </span>
      );
    case "low":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 ${className}`}
        >
          {showIcon && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
          <span>Low</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700/60 ${className}`}
        >
          {showIcon && <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />}
          <span>{norm}</span>
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{
  priority: IssuePriority | string;
  className?: string;
}> = ({ priority, className = "" }) => {
  const norm = (priority || "medium").toLowerCase();

  switch (norm) {
    case "urgent":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          <span>P0 Urgent</span>
        </span>
      );
    case "high":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span>P1 High</span>
        </span>
      );
    case "medium":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
          <span>P2 Medium</span>
        </span>
      );
    case "low":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-900 text-zinc-500 border border-zinc-800 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
          <span>P3 Low</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60 ${className}`}
        >
          <span className="capitalize">{norm}</span>
        </span>
      );
  }
};

export const SourceBadge: React.FC<{ source: IssueSource | string; className?: string }> = ({
  source,
  className = "",
}) => {
  const norm = (source || "manual").toLowerCase();

  switch (norm) {
    case "ai_assistant":
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 ${className}`}
        >
          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
          <span>Diagnostic</span>
        </span>
      );
    case "repo_scan":
    case "web_scan":
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 ${className}`}
        >
          <ShieldAlert className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>Security</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-800/80 border border-zinc-700/50 ${className}`}
        >
          <Terminal className="w-3 h-3 shrink-0" />
          <span>Manual</span>
        </span>
      );
  }
};
