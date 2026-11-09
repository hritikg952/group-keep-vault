import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppUser, Group, GroupMember } from '../types';
import { supabaseService, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: AppUser | null;
  group: Group | null;
  groupId: string | null;
  groupMembers: GroupMember[];
  isLoading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  createGroup: (name: string) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<Group>;
  refreshGroup: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadGroup = async (u: AppUser) => {
    try {
      const { group: grp, members } = await supabaseService.getUserGroup(u.id);
      setGroup(grp);
      setGroupMembers(members);
      if (grp) {
        setUser((prev) => (prev ? { ...prev, groupId: grp.id } : prev));
      }
    } catch (err) {
      console.error('Failed to load user group:', err);
    }
  };

  useEffect(() => {
    const unsub = supabaseService.onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        await loadGroup(u);
      } else {
        setGroup(null);
        setGroupMembers([]);
      }
      setIsLoading(false);
    });

    return () => {
      unsub();
    };
  }, []);

  const handleCreateGroup = async (name: string): Promise<Group> => {
    if (!user) throw new Error('Must be logged in to create a group.');
    const newGrp = await supabaseService.createGroup(name, user);
    await loadGroup(user);
    return newGrp;
  };

  const handleJoinGroup = async (inviteCode: string): Promise<Group> => {
    if (!user) throw new Error('Must be logged in to join a group.');
    const joined = await supabaseService.joinGroupByCode(inviteCode, user);
    await loadGroup(user);
    return joined;
  };

  const handleRefreshGroup = async () => {
    if (user) {
      await loadGroup(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        group,
        groupId: group?.id || null,
        groupMembers,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle: () => supabaseService.signInWithGoogle(),
        signInWithOtp: (email: string) => supabaseService.signInWithOtp(email),
        signOut: () => supabaseService.signOut(),
        createGroup: handleCreateGroup,
        joinGroup: handleJoinGroup,
        refreshGroup: handleRefreshGroup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
