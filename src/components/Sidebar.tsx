import React from 'react';
import { 
  Lightbulb, 
  Users, 
  User, 
  Lock, 
  Archive, 
  Trash2, 
  Tag 
} from 'lucide-react';

export type ActiveTab = 'all' | 'group' | 'personal' | 'vault' | 'archive' | 'trash';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  selectedLabel: string | null;
  onSelectLabel: (label: string | null) => void;
  isOpen: boolean;
  notesCounts: {
    all: number;
    group?: number;
    personal: number;
    vault: number;
    archive: number;
    trash: number;
  };
  labels: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  selectedLabel,
  onSelectLabel,
  isOpen,
  notesCounts,
  labels,
}) => {
  const groupCount = notesCounts.group ?? 0;
  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; count: number }> = [
    { id: 'all', label: 'All Notes', icon: <Lightbulb className="w-5 h-5" />, count: notesCounts.all },
    { id: 'group', label: 'Group Notes', icon: <Users className="w-5 h-5 text-blue-500" />, count: groupCount },
    { id: 'personal', label: 'Personal (Private)', icon: <User className="w-5 h-5 text-emerald-500" />, count: notesCounts.personal },
    { id: 'vault', label: 'Encrypted Vault', icon: <Lock className="w-5 h-5 text-amber-500" />, count: notesCounts.vault },
    { id: 'archive', label: 'Archive', icon: <Archive className="w-5 h-5 text-purple-500" />, count: notesCounts.archive },
    { id: 'trash', label: 'Trash', icon: <Trash2 className="w-5 h-5 text-rose-500" />, count: notesCounts.trash },
  ];

  return (
    <aside
      className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-white dark:bg-[#202124] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-30 overflow-y-auto ${
        isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'
      }`}
    >
      <div className="p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id && selectedLabel === null;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onSelectLabel(null);
              }}
              title={item.label}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-full text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="shrink-0">{item.icon}</span>
                {isOpen && <span className="truncate">{item.label}</span>}
              </div>
              {isOpen && item.count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Labels Divider & List */}
        {isOpen && labels.length > 0 && (
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              Labels
            </div>
            {labels.map((lbl) => {
              const isSelected = selectedLabel === lbl;
              return (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => onSelectLabel(lbl)}
                  className={`w-full flex items-center gap-4 px-3.5 py-2 rounded-full text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">#{lbl}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
