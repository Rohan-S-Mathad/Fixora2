import React from "react";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  KanbanSquare,
  Sparkles,
  ShieldAlert,
  BarChart,
  Settings,
  Bug,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Zap,
} from "lucide-react";
import { getInitials } from "../../lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { activeView, setActiveView, issues, activeProject } = useProject();
  const { user } = useAuth();

  const openIssuesCount = issues.filter(
    (i) => i.status !== "closed" && i.status !== "resolved"
  ).length;

  const navItemClass = (viewId: string) => {
    const active = activeView === viewId;
    return `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
      active
        ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm"
        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
    }`;
  };

  const content = (
    <div className="flex flex-col h-full bg-[#08090e] border-r border-zinc-800/80 select-none">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/80">
        <div
          onClick={() => {
            setActiveView("dashboard");
            if (isMobileOpen) onCloseMobile();
          }}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-105 transition-transform">
            <Bug className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Fixora
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800/50">
                  v1.4
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Workspace section */}
        <div>
          {!isCollapsed && (
            <div className="px-2 mb-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Workspace
            </div>
          )}
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveView("dashboard");
                if (isMobileOpen) onCloseMobile();
              }}
              className={navItemClass("dashboard")}
              title={isCollapsed ? "Dashboard" : undefined}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-indigo-300" />
              {!isCollapsed && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => {
                setActiveView("projects");
                if (isMobileOpen) onCloseMobile();
              }}
              className={navItemClass("projects")}
              title={isCollapsed ? "Projects" : undefined}
            >
              <FolderGit2 className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-indigo-300" />
              {!isCollapsed && <span>Projects</span>}
            </button>

            <button
              onClick={() => {
                setActiveView("issues");
                if (isMobileOpen) onCloseMobile();
              }}
              className={navItemClass("issues")}
              title={isCollapsed ? "Issues" : undefined}
            >
              <CheckSquare className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-indigo-300" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>Issues</span>
                  {openIssuesCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {openIssuesCount}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveView("board");
                if (isMobileOpen) onCloseMobile();
              }}
              className={navItemClass("board")}
              title={isCollapsed ? "Kanban Board" : undefined}
            >
              <KanbanSquare className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-indigo-300" />
              {!isCollapsed && <span>Kanban Board</span>}
            </button>
          </div>
        </div>

        {/* AI & Security Section */}
        <div>
          {!isCollapsed && (
            <div className="px-2 mb-1.5 text-[10px] font-mono uppercase tracking-widest text-indigo-400/90 flex items-center justify-between">
              <span>AI Intelligence</span>
              <Sparkles className="w-3 h-3 text-indigo-400" />
            </div>
          )}
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveView("ai-hunter");
                if (isMobileOpen) onCloseMobile();
              }}
              className={navItemClass("ai-hunter")}
              title={isCollapsed ? "AI Bug Hunter" : undefined}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 group-hover:text-rose-300" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-zinc-200">AI Bug Hunter</span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Live
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveView("ai-assistant");
                if (isMobileOpen) onCloseMobile();
              }}
              className={navItemClass("ai-assistant")}
              title={isCollapsed ? "Bug Assistant" : undefined}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-indigo-400 group-hover:text-indigo-300" />
              {!isCollapsed && <span>Bug Assistant</span>}
            </button>
          </div>
        </div>

        {/* System & Analytics Section */}
        <div>
          {!isCollapsed && (
            <div className="px-2 mb-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              System
            </div>
          )}
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveView("analytics");
                if (isMobileOpen) onCloseMobile();
              }}
              className={navItemClass("analytics")}
              title={isCollapsed ? "Analytics" : undefined}
            >
              <BarChart className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-indigo-300" />
              {!isCollapsed && <span>Analytics</span>}
            </button>

            <button
              onClick={() => {
                setActiveView("settings");
                if (isMobileOpen) onCloseMobile();
              }}
              className={navItemClass("settings")}
              title={isCollapsed ? "Settings" : undefined}
            >
              <Settings className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-indigo-300" />
              {!isCollapsed && <span>Settings</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Profile */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#06070b]">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold ring-1 ring-white/10 shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name || "Alex River"}</p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">{user?.email || "alex@fixora.io"}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold ring-1 ring-white/10">
              {getInitials(user?.name)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
