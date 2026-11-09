import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { supabaseService } from './services/supabase';
import { Note } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TakeNote } from './components/TakeNote';
import { NoteCard } from './components/NoteCard';
import { NoteModal } from './components/NoteModal';
import { VaultModal } from './components/VaultModal';
import { GroupShareModal } from './components/GroupShareModal';
import { AuthScreen } from './components/AuthScreen';
import { 
  Lightbulb, 
  Users, 
  User, 
  Lock, 
  Archive, 
  Trash2, 
  SearchX, 
  UserPlus 
} from 'lucide-react';

export function App() {
  const { user, group, isLoading } = useAuth();
  const currentGroup = group;

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Modals
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);

  // Apply dark mode class to html tag
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Subscribe to real-time notes
  useEffect(() => {
    if (!user) return;
    const unsub = supabaseService.subscribeToNotes(user, (updatedNotes) => {
      setNotes(updatedNotes);
    });
    return () => unsub();
  }, [user, currentGroup?.id]);

  // Extract unique labels
  const allLabels = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.labels?.forEach((l) => set.add(l)));
    return Array.from(set);
  }, [notes]);

  // Counts for sidebar
  const notesCounts = useMemo(() => {
    const groupCount = notes.filter((n) => !n.isArchived && !n.isTrash && n.sharing === 'group').length;
    return {
      all: notes.filter((n) => !n.isArchived && !n.isTrash).length,
      group: groupCount,
      personal: notes.filter((n) => !n.isArchived && !n.isTrash && n.sharing === 'personal').length,
      vault: notes.filter((n) => !n.isArchived && !n.isTrash && n.isEncrypted).length,
      archive: notes.filter((n) => n.isArchived && !n.isTrash).length,
      trash: notes.filter((n) => n.isTrash).length,
    };
  }, [notes]);

  // Filtered notes based on current tab, label, and search query
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Tab filter
      if (activeTab === 'trash') {
        if (!note.isTrash) return false;
      } else if (note.isTrash) {
        return false;
      } else if (activeTab === 'archive') {
        if (!note.isArchived) return false;
      } else {
        if (note.isArchived) return false;
        if (activeTab === 'group' && note.sharing !== 'group') return false;
        if (activeTab === 'personal' && note.sharing !== 'personal') return false;
        if (activeTab === 'vault' && !note.isEncrypted) return false;
      }

      // Label filter
      if (selectedLabel && !note.labels?.includes(selectedLabel)) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(q);
        const matchContent = note.content.toLowerCase().includes(q);
        const matchItems = note.checklistItems?.some((i) => i.text.toLowerCase().includes(q));
        const matchLabels = note.labels?.some((l) => l.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchItems && !matchLabels) {
          return false;
        }
      }

      return true;
    });
  }, [notes, activeTab, selectedLabel, searchQuery]);

  // Split into Pinned and Others
  const { pinnedNotes, otherNotes } = useMemo(() => {
    const pinned: Note[] = [];
    const others: Note[] = [];
    filteredNotes.forEach((n) => {
      if (n.isPinned && activeTab !== 'trash' && activeTab !== 'archive') {
        pinned.push(n);
      } else {
        others.push(n);
      }
    });
    return { pinnedNotes: pinned, otherNotes: others };
  }, [filteredNotes, activeTab]);

  // Show loading spinner while initializing auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#202124] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not signed in, show Google / Magic Link Auth Landing screen
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#202124] text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
        onOpenGroupModal={() => setIsGroupModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Drawer */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          selectedLabel={selectedLabel}
          onSelectLabel={setSelectedLabel}
          isOpen={isSidebarOpen}
          notesCounts={notesCounts}
          labels={allLabels}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {/* Banner if user has not created or joined a group yet */}
          {!currentGroup && (
            <div className="max-w-3xl mx-auto mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="text-xs text-gray-800 dark:text-gray-200">
                  <span className="font-semibold text-blue-900 dark:text-blue-200">Join or Create a Group: </span>
                  Connect with your group to share grocery lists, notes, and zero-knowledge vault secrets live.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
              >
                Set up Group
              </button>
            </div>
          )}

          {/* Take a note box (only on active notes view) */}
          {activeTab !== 'trash' && activeTab !== 'archive' && (
            <TakeNote onVaultUnlockRequest={() => setIsVaultModalOpen(true)} />
          )}

          {/* Notes Container */}
          <div className="max-w-7xl mx-auto mt-6">
            {filteredNotes.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 dark:text-gray-500">
                {searchQuery ? (
                  <>
                    <SearchX className="w-16 h-16 stroke-1 mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-medium">No notes match &ldquo;{searchQuery}&rdquo;</p>
                  </>
                ) : activeTab === 'vault' ? (
                  <>
                    <Lock className="w-16 h-16 stroke-1 mb-3 text-amber-500/50" />
                    <p className="text-sm font-medium">No encrypted notes yet</p>
                    <p className="text-xs mt-1">Click the lock icon when creating a note to encrypt secrets with AES-256</p>
                  </>
                ) : activeTab === 'group' ? (
                  <>
                    <Users className="w-16 h-16 stroke-1 mb-3 text-blue-500/50" />
                    <p className="text-sm font-medium">No group shared notes yet</p>
                    <p className="text-xs mt-1">Notes tagged with &ldquo;Group Sync&rdquo; will appear here for all group members</p>
                  </>
                ) : activeTab === 'personal' ? (
                  <>
                    <User className="w-16 h-16 stroke-1 mb-3 text-emerald-500/50" />
                    <p className="text-sm font-medium">No personal notes yet</p>
                    <p className="text-xs mt-1">Notes tagged &ldquo;Personal&rdquo; remain completely private to you</p>
                  </>
                ) : activeTab === 'archive' ? (
                  <>
                    <Archive className="w-16 h-16 stroke-1 mb-3 text-purple-500/50" />
                    <p className="text-sm font-medium">Your archived notes will appear here</p>
                  </>
                ) : activeTab === 'trash' ? (
                  <>
                    <Trash2 className="w-16 h-16 stroke-1 mb-3 text-rose-500/50" />
                    <p className="text-sm font-medium">Trash is empty</p>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-16 h-16 stroke-1 mb-3 text-amber-400/50" />
                    <p className="text-sm font-medium">Notes you add appear here</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {/* PINNED SECTION */}
                {pinnedNotes.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 px-1">
                      Pinned
                    </div>
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-4'
                          : 'max-w-2xl mx-auto space-y-3'
                      }
                    >
                      {pinnedNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onClick={() => setEditingNote(note)}
                          onVaultUnlockRequest={() => setIsVaultModalOpen(true)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* OTHERS SECTION */}
                {otherNotes.length > 0 && (
                  <div>
                    {pinnedNotes.length > 0 && (
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 px-1">
                        Others
                      </div>
                    )}
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-4'
                          : 'max-w-2xl mx-auto space-y-3'
                      }
                    >
                      {otherNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onClick={() => setEditingNote(note)}
                          onVaultUnlockRequest={() => setIsVaultModalOpen(true)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Note Editor Modal */}
      <NoteModal
        note={editingNote}
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        onVaultUnlockRequest={() => {
          setEditingNote(null);
          setIsVaultModalOpen(true);
        }}
      />

      {/* Group Vault Passphrase Modal */}
      <VaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />

      {/* Group Share Modal */}
      <GroupShareModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </div>
  );
}

export default App;
