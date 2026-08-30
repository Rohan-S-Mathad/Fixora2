import React, { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { DashboardView } from "../views/DashboardView";
import { ProjectsView } from "../views/ProjectsView";
import { IssuesView } from "../views/IssuesView";
import { IssueDetailView } from "../views/IssueDetailView";
import { KanbanBoardView } from "../views/KanbanBoardView";
import { AIBugHunterView } from "../views/AIBugHunterView";
import { AIAssistantView } from "../views/AIAssistantView";
import { AnalyticsView } from "../views/AnalyticsView";
import { SettingsView } from "../views/SettingsView";
import { CommandPalette } from "../common/CommandPalette";
import { CreateIssueModal } from "../common/CreateIssueModal";
import { CreateProjectModal } from "../common/CreateProjectModal";

export const AppShell: React.FC = () => {
  const { activeView } = useProject();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "projects":
        return <ProjectsView />;
      case "issues":
        return <IssuesView />;
      case "issue-detail":
        return <IssueDetailView />;
      case "board":
        return <KanbanBoardView />;
      case "ai-hunter":
        return <AIBugHunterView />;
      case "ai-assistant":
        return <AIAssistantView />;
      case "analytics":
        return <AnalyticsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07080c] text-zinc-100 antialiased font-sans select-none">
      {/* Persistent Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        {/* Dynamic View Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#07080c]">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <CommandPalette />
      <CreateIssueModal />
      <CreateProjectModal />
    </div>
  );
};
