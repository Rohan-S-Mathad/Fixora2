import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { api, getAuthToken, clearAuthToken, setAuthToken } from "../lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  allUsers: User[];
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsersAndCurrent = async () => {
    try {
      setIsLoading(true);
      const [currentUser, usersList] = await Promise.all([
        api.auth.getCurrentUser(),
        api.auth.getAllUsers(),
      ]);
      setUser(currentUser);
      setAllUsers(usersList);
    } catch (err) {
      console.error("Auth verification failed", err);
      clearAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndCurrent();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setUser(res.user);
      const usersList = await api.auth.getAllUsers();
      setAllUsers(usersList);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    try {
      const newUser = await api.auth.register(name, email, password);
      setUser(newUser);
      const usersList = await api.auth.getAllUsers();
      setAllUsers(usersList);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const switchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const switched = await api.auth.switchUser(userId);
      setUser(switched);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const u = await api.auth.getCurrentUser();
    setUser(u);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        switchUser,
        allUsers,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
