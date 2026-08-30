import React, { useState, useEffect, useMemo } from "react";
import { useProject } from "../../context/ProjectContext";
import {
  Search,
  CheckSquare,
  FolderGit2,
  Sparkles,
  ShieldAlert,
  Plus,
  LayoutDashboard,
  KanbanSquare,
  BarChart,
  Settings,
  ArrowRight,
  Flame,
} from "lucide-react";
import { SeverityBadge } from "./Badges";

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    projects,
    setActiveProject,
    issues,
    setActiveView,
    setSelectedIssueId,
    setIsCreateIssueOpen,
    setIsCreateProjectOpen,
  } = useProject();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  // Actions
  const navActions = useMemo(
    () => [
      {
        id: "nav-dashboard",
        title: "Go to Dashboard",
        category: "Navigation",
        icon: LayoutDashboard,
        action: () => {
          setActiveView("dashboard");
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-issues",
        title: "Go to Issues List",
        category: "Navigation",
        icon: CheckSquare,
        action: () => {
          setActiveView("issues");
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-board",
        title: "Go to Kanban Board",
        category: "Navigation",
        icon: KanbanSquare,
        action: () => {
          setActiveView("board");
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-projects",
        title: "Go to Projects",
        category: "Navigation",
        icon: FolderGit2,
        action: () => {
          setActiveView("projects");
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-hunter",
        title: "Go to AI Bug Hunter",
        category: "AI Tools",
        icon: ShieldAlert,
        action: () => {
          setActiveView("ai-hunter");
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-assistant",
        title: "Go to AI Bug Assistant",
        category: "AI Tools",
        icon: Sparkles,
        action: () => {
          setActiveView("ai-assistant");
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-analytics",
        title: "Go to Analytics",
        category: "Navigation",
        icon: BarChart,
        action: () => {
          setActiveView("analytics");
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-settings",
        title: "Go to Settings",
        category: "Navigation",
        icon: Settings,
        action: () => {
          setActiveView("settings");
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: "act-create-issue",
        title: "Create New Issue...",
        category: "Actions",
        icon: Plus,
        shortcut: "C",
        action: () => {
          setIsCommandPaletteOpen(false);
          setIsCreateIssueOpen(true);
        },
      },
      {
        id: "act-create-project",
        title: "Create New Project...",
        category: "Actions",
        icon: Plus,
        action: () => {
          setIsCommandPaletteOpen(false);
          setIsCreateProjectOpen(true);
        },
      },
    ],
    [setActiveView, setIsCommandPaletteOpen, setIsCreateIssueOpen, setIsCreateProjectOpen]
  );

  // Filtered results
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return navActions;
    }

    const matchedActions = navActions.filter((a) =>
      a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );

    const matchedProjects = projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
      .map((p) => ({
        id: `proj-${p.id}`,
        title: `${p.name} (${p.key})`,
        category: "Projects",
        icon: FolderGit2,
        action: () => {
          setActiveProject(p);
          setActiveView("issues");
          setIsCommandPaletteOpen(false);
        },
      }));

    const matchedIssues = issues
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          `fix-${i.issue_number}`.toLowerCase().includes(q) ||
          (i.component && i.component.toLowerCase().includes(q))
      )
      .slice(0, 6)
      .map((i) => ({
        id: `issue-${i.id}`,
        title: `FIX-${i.issue_number}: ${i.title}`,
        category: "Issues",
        severity: i.severity,
        icon: CheckSquare,
        action: () => {
          setSelectedIssueId(i.id);
          setActiveView("issue-detail");
          setIsCommandPaletteOpen(false);
        },
      }));

    return [...matchedActions, ...matchedProjects, ...matchedIssues];
  }, [query, navActions, projects, issues, setActiveProject, setActiveView, setSelectedIssueId, setIsCommandPaletteOpen]);

  // Keyboard navigation within command palette
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isCommandPaletteOpen) return;
      if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isCommandPaletteOpen, filteredItems, selectedIndex, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#0e1017] border border-zinc-700/70 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input bar */}
        <div className="flex items-center px-4 border-b border-zinc-800 bg-[#12151f]">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, search issues, projects, or tools..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full h-12 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800/80 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-800/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No matching commands, issues, or projects found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    isSelected ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30" : "text-zinc-300 hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-indigo-500/30 text-indigo-300" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate font-medium">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {"severity" in item && item.severity && (
                      <SeverityBadge severity={item.severity as any} showIcon={false} />
                    )}
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#0a0c12] border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Fixora Quick Engine</span>
        </div>
      </div>
    </div>
  );
};
