
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo } from 'react';
import type { User, UserRole, NotificationSettings } from '@/lib/types';
import { users } from '@/lib/mock-data';

interface UserContextType {
  user: User;
  setUserRole: (role: UserRole) => void;
  roles: UserRole[];
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Set default user to 'Administrator' to show the add button
  const [currentUser, setCurrentUser] = useState<User>(users.find(u => u.role === 'Administrator')!);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    shippingUnverified: true,
    shippingExpired: true,
    verificationNeeded: true,
    verificationPending: true,
  });

  const roles = useMemo(() => users.map(u => u.role), []);

  const setUserRole = (role: UserRole) => {
    const selectedUser = users.find(u => u.role === role);
    if (selectedUser) {
      setCurrentUser(selectedUser);
    }
  };

  const value = useMemo(() => ({
    user: currentUser,
    setUserRole,
    roles,
    notificationSettings,
    setNotificationSettings,
  }), [currentUser, roles, notificationSettings]);

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
