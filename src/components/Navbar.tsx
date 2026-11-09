import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { 
  Search, 
  X, 
  Menu, 
  LayoutGrid, 
  List, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Lock, 
  Users, 
  LogOut,
  UserPlus
} from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list';
  onToggleViewMode: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
  onOpenVaultModal: () => void;
  onOpenGroupModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onToggleViewMode,
  isDarkMode,
  onToggleDarkMode,
  onToggleSidebar,
  onOpenVaultModal,
  onOpenGroupModal,
}) => {
  const { user, group, signOut } = useAuth();
  const { isUnlocked } = useVault();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const handleOpenGroup = onOpenGroupModal || (() => {});

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#202124]/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="flex items-center justify-between px-3 md:px-6 h-16 gap-3">
        {/* Left: Hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
            title="Main menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 select-none cursor-pointer">
            {/* Google Keep style bulb logo with safe shield */}
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-amber-950 font-bold shadow-sm">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#202124] flex items-center justify-center text-[8px] text-white font-bold" title="Zero-Knowledge Encrypted">
                ✓
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-lg tracking-tight text-gray-800 dark:text-gray-100">
                Keep
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60">
                Vault
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-2xl mx-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes, checklists, tags..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-transparent focus:border-gray-300 dark:focus:border-gray-700 focus:bg-white dark:focus:bg-[#202124] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Group Badge */}
          <button
            type="button"
            onClick={handleOpenGroup}
            title={group ? `Connected to ${group.name}` : 'Join or create group'}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              group
                ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                : 'border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            {group ? <Users className="w-3.5 h-3.5 text-blue-500" /> : <UserPlus className="w-3.5 h-3.5 text-amber-500" />}
            <span className="truncate max-w-[120px] font-medium">{group ? group.name : 'Join Group'}</span>
          </button>

          {/* Vault Lock Status Indicator */}
          <button
            type="button"
            onClick={onOpenVaultModal}
            title={isUnlocked ? 'Vault Unlocked (AES-256)' : 'Vault Locked (Click to Unlock)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isUnlocked
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            }`}
          >
            {isUnlocked ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Vault Open</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Unlock Vault</span>
              </>
            )}
          </button>

          {/* View Mode Toggle */}
          <button
            type="button"
            onClick={onToggleViewMode}
            title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Avatar & Menu */}
          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 p-0.5 rounded-full ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-700 transition-all"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#202124] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {user?.displayName || 'Group Member'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'No email attached'}
                  </div>
                  {group && (
                    <div className="mt-1.5 inline-block text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                      {group.name}
                    </div>
                  )}
                </div>

                <div className="p-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleOpenGroup();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <Users className="w-4 h-4 text-blue-500" />
                    Group & Members
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenVaultModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    Group Vault Passphrase
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
