import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import { useNotification } from "../../context/NotificationContext";
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  FolderGit2,
  Check,
  Sparkles,
  ShieldAlert,
  Menu,
  X,
  ExternalLink,
  User as UserIcon,
  LogOut,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { formatDate, getInitials } from "../../lib/utils";

export const Header: React.FC<{ onToggleMobileSidebar: () => void }> = ({
  onToggleMobileSidebar,
}) => {
  const { user, logout, switchUser, allUsers } = useAuth();
  const {
    activeProject,
    projects,
    setActiveProject,
    activeView,
    setActiveView,
    setIsCreateIssueOpen,
    setIsCommandPaletteOpen,
  } = useProject();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (activeView) {
      case "dashboard":
        return "Dashboard";
      case "projects":
        return "Projects";
      case "issues":
        return "Issues";
      case "issue-detail":
        return "Issue Details";
      case "board":
        return "Kanban Board";
      case "ai-assistant":
        return "AI Bug Assistant";
      case "ai-hunter":
        return "AI Bug Hunter";
      case "analytics":
        return "Analytics";
      case "settings":
        return "Settings";
      default:
        return "Workspace";
    }
  };

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-[#090b11]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Toggle, Breadcrumb & Project Selector */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Project Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProjectDropdownOpen((prev) => !prev);
              setIsNotifDropdownOpen(false);
              setIsUserDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-200 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[120px] sm:max-w-[180px]">
              {activeProject ? activeProject.name : "Select Project"}
            </span>
            {activeProject && (
              <span className="text-[10px] font-mono text-zinc-400 px-1 py-0.2 rounded bg-zinc-800 border border-zinc-700/60">
                {activeProject.key}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>

          {isProjectDropdownOpen && (
            <div
              className="absolute left-0 mt-1.5 w-64 bg-[#0e111a] border border-zinc-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                Switch Project
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {projects.map((p) => {
                  const isSelected = activeProject?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProject(p);
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-indigo-600/20 text-indigo-200 font-medium"
                          : "text-zinc-300 hover:bg-zinc-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FolderGit2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <div className="truncate">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{p.key}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    setActiveView("projects");
                  }}
                  className="w-full text-center py-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 rounded font-medium transition-colors"
                >
                  Manage All Projects →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Breadcrumb Separator */}
        <span className="hidden sm:inline text-zinc-600">/</span>
        <span className="hidden sm:inline text-xs font-medium text-zinc-400">
          {getBreadcrumbTitle()}
        </span>
      </div>

      {/* Right: Quick Search, Quick Create, Notifications, User Menu */}
      <div className="flex items-center gap-2.5">
        {/* Global Search Bar (Trigger Cmd+K) */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 transition-colors w-48 lg:w-64"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="flex-1 text-left truncate">Search issues, code, tools...</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            ⌘K
          </kbd>
        </button>

        {/* Quick New Issue Button */}
        <button
          onClick={() => setIsCreateIssueOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Issue</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifDropdownOpen((prev) => !prev);
              setIsProjectDropdownOpen(false);
              setIsUserDropdownOpen(false);
            }}
            className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#090b11]" />
            )}
          </button>

          {isNotifDropdownOpen && (
            <div
              className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-[#0e111a] border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-[#121520]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-100">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-left transition-colors cursor-pointer ${
                        !n.read ? "bg-indigo-950/20 hover:bg-indigo-950/30" : "hover:bg-zinc-800/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-zinc-200 leading-tight">
                          {n.title}
                        </p>
                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                          {formatDate(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setIsUserDropdownOpen((prev) => !prev);
              setIsProjectDropdownOpen(false);
              setIsNotifDropdownOpen(false);
            }}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center text-xs font-mono font-semibold">
              {getInitials(user?.name)}
            </div>
            <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:block" />
          </button>

          {isUserDropdownOpen && (
            <div
              className="absolute right-0 mt-1.5 w-64 bg-[#0e111a] border border-zinc-700/80 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* User info */}
              <div className="px-3.5 py-2 border-b border-zinc-800/80">
                <p className="text-xs font-semibold text-zinc-100">{user?.name || "Developer"}</p>
                <p className="text-[11px] text-zinc-400 font-mono truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-medium bg-zinc-800 text-indigo-300 border border-zinc-700">
                  {user?.role || "Admin"}
                </span>
              </div>

              {/* Demo Account Switcher */}
              <div className="px-3.5 py-2 border-b border-zinc-800/80">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1.5">
                  Demo Profiles
                </p>
                <div className="space-y-1">
                  {allUsers.map((u) => {
                    const isCur = u.id === user?.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                          isCur ? "bg-indigo-600/20 text-indigo-200" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        <span className="truncate">{u.name}</span>
                        <span className="text-[10px] font-mono opacity-60">({u.role})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveView("settings");
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Platform Settings</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
