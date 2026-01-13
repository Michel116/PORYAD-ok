
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { User, UserRole, NotificationSettings } from '@/lib/types';
import { users as initialUsers } from '@/lib/mock-data';
import bcrypt from 'bcryptjs';

interface UserContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (name: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
  roles: UserRole[];
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  addUser: (name: string, pass: string, role: UserRole) => boolean;
  deleteUser: (userId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    shippingUnverified: true,
    shippingExpired: true,
    verificationNeeded: true,
    verificationPending: true,
  });

  const isAuthenticated = !!currentUser;

  const roles = useMemo(() => Array.from(new Set(users.map(u => u.role))), [users]);

  const login = useCallback(async (name: string, pass: string): Promise<boolean> => {
    const userToLogin = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (userToLogin && userToLogin.passwordHash) {
      const match = await bcrypt.compare(pass, userToLogin.passwordHash);
      if (match) {
        setCurrentUser(userToLogin);
        return true;
      }
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const setUserRole = (role: UserRole) => {
    if (!isAuthenticated) return;
    const selectedUser = users.find(u => u.role === role);
    if (selectedUser) {
      setCurrentUser(selectedUser);
    }
  };
  
  const addUser = (name: string, pass: string, role: UserRole): boolean => {
    if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
        return false; // User already exists
    }
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(pass, salt);
    
    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email: `${name}@example.com`,
        role,
        avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
        passwordHash,
    };
    
    setUsers(prev => [...prev, newUser]);
    return true;
  };
  
  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };


  const value = useMemo(() => ({
    user: currentUser,
    users,
    isAuthenticated,
    login,
    logout,
    setUserRole,
    roles,
    notificationSettings,
    setNotificationSettings,
    addUser,
    deleteUser,
  }), [currentUser, users, isAuthenticated, login, logout, roles, notificationSettings]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
