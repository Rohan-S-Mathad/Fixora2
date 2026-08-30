import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Project, Issue, Scan, ProjectMember, IssueStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  isLoadingProjects: boolean;
  issues: Issue[];
  isLoadingIssues: boolean;
  activeScan: Scan | null;
  setActiveScan: (scan: Scan | null) => void;
  members: ProjectMember[];
  refreshProjects: () => Promise<void>;
  refreshIssues: () => Promise<void>;
  createProject: (data: { name: string; key: string; description?: string; github_repo_url?: string }) => Promise<Project>;
  createIssue: (data: Partial<Issue>) => Promise<Issue>;
  updateIssue: (issueId: string, updates: Partial<Issue>) => Promise<Issue>;
  activeView: string;
  setActiveView: (view: string) => void;
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
  isCreateIssueOpen: boolean;
  setIsCreateIssueOpen: (open: boolean) => void;
  isCreateProjectOpen: boolean;
  setIsCreateProjectOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  quickPrefillIssueData: Partial<Issue> | null;
  setQuickPrefillIssueData: (data: Partial<Issue> | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [activeScan, setActiveScan] = useState<Scan | null>(null);

  // Navigation & View state
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Modals & Overlays
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [quickPrefillIssueData, setQuickPrefillIssueData] = useState<Partial<Issue> | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      setIsLoadingProjects(true);
      const list = await api.projects.list();
      setProjects(list);
      if (list.length > 0) {
        // Retain current or set first
        setActiveProject((prev) => {
          if (prev && list.some((p) => p.id === prev.id)) {
            return list.find((p) => p.id === prev.id) || list[0];
          }
          return list[0];
        });
      } else {
        setActiveProject(null);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const refreshIssues = useCallback(async () => {
    if (!activeProject) {
      setIssues([]);
      return;
    }
    try {
      setIsLoadingIssues(true);
      const list = await api.issues.list(activeProject.id);
      setIssues(list);
    } catch (err) {
      console.error("Failed to load issues", err);
    } finally {
      setIsLoadingIssues(false);
    }
  }, [activeProject]);

  const loadMembers = useCallback(async () => {
    if (!activeProject) {
      setMembers([]);
      return;
    }
    try {
      const mems = await api.projects.getMembers(activeProject.id);
      setMembers(mems);
    } catch (err) {
      console.error("Failed to load members", err);
    }
  }, [activeProject]);

  useEffect(() => {
    if (user) {
      refreshProjects();
    }
  }, [user, refreshProjects]);

  useEffect(() => {
    if (activeProject) {
      refreshIssues();
      loadMembers();
    }
  }, [activeProject, refreshIssues, loadMembers]);

  const createProject = async (data: { name: string; key: string; description?: string; github_repo_url?: string }): Promise<Project> => {
    const newProj = await api.projects.create(data);
    await refreshProjects();
    setActiveProject(newProj);
    return newProj;
  };

  const createIssue = async (data: Partial<Issue>): Promise<Issue> => {
    if (!activeProject) throw new Error("No active project selected");
    const newIss = await api.issues.create(activeProject.id, data);
    await refreshIssues();
    await refreshProjects();
    return newIss;
  };

  const updateIssue = async (issueId: string, updates: Partial<Issue>): Promise<Issue> => {
    const updated = await api.issues.update(issueId, updates);
    // Optimistically update issue in list
    setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
    return updated;
  };

  // Global Keyboard shortcuts (Cmd+K / Ctrl+K, C for create issue)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === "c" && !isCreateIssueOpen && !isCommandPaletteOpen && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setIsCreateIssueOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateIssueOpen, isCommandPaletteOpen]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        isLoadingProjects,
        issues,
        isLoadingIssues,
        activeScan,
        setActiveScan,
        members,
        refreshProjects,
        refreshIssues,
        createProject,
        createIssue,
        updateIssue,
        activeView,
        setActiveView,
        selectedIssueId,
        setSelectedIssueId,
        isCreateIssueOpen,
        setIsCreateIssueOpen,
        isCreateProjectOpen,
        setIsCreateProjectOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        quickPrefillIssueData,
        setQuickPrefillIssueData,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
