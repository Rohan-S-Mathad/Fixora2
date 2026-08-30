/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AppShell } from "./components/layout/AppShell";

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <NotificationProvider>
          <AppShell />
        </NotificationProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}
