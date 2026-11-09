import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { supabaseService } from '../services/supabase';
import { Note, ChecklistItem, SharingScope } from '../types';
import { getColorConfig } from '../constants/colors';
import { ColorPalette } from './ColorPalette';
import { 
  CheckSquare, 
  Lock, 
  Palette, 
  Pin, 
  Plus, 
  Trash2, 
  Users, 
  User, 
  Type
} from 'lucide-react';

interface TakeNoteProps {
  onVaultUnlockRequest: () => void;
}

export const TakeNote: React.FC<TakeNoteProps> = ({ onVaultUnlockRequest }) => {
  const { user, groupId } = useAuth();
  const { isUnlocked, encryptPayload } = useVault();

  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<'text' | 'checklist'>('text');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [color, setColor] = useState('default');
  const [isPinned, setIsPinned] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [sharing, setSharing] = useState<SharingScope>('group');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);

  const colorCfg = getColorConfig(color);

  // Auto-save and collapse when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isExpanded) {
          handleSaveAndClose();
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, title, content, checklistItems, isEncrypted, sharing, color, isPinned, isUnlocked]);

  const handleExpand = (initialType: 'text' | 'checklist' = 'text', encrypted = false) => {
    setIsExpanded(true);
    setNoteType(initialType);
    if (encrypted) {
      if (!isUnlocked) {
        onVaultUnlockRequest();
      }
      setIsEncrypted(true);
    }
    setTimeout(() => {
      if (initialType === 'text') {
        contentInputRef.current?.focus();
      } else {
        newItemInputRef.current?.focus();
      }
    }, 50);
  };

  const handleToggleEncrypted = () => {
    if (!isEncrypted) {
      if (!isUnlocked) {
        onVaultUnlockRequest();
      }
      setIsEncrypted(true);
    } else {
      setIsEncrypted(false);
    }
  };

  const handleAddChecklistItem = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newItemText.trim()) {
      e.preventDefault();
      setChecklistItems([
        ...checklistItems,
        { id: `item-${Date.now()}-${Math.random()}`, text: newItemText.trim(), completed: false },
      ]);
      setNewItemText('');
    }
  };

  const handleToggleCheckItem = (id: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleDeleteCheckItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const handleSaveAndClose = async () => {
    const hasText = title.trim() || content.trim() || checklistItems.length > 0;
    if (!hasText) {
      resetForm();
      return;
    }

    if (!user) return;

    try {
      const now = Date.now();
      const noteId = `note-${now}-${Math.random().toString(36).substring(2, 8)}`;

      let encryptedPayload: string | undefined;
      let iv: string | undefined;
      let salt: string | undefined;
      let storedTitle = title.trim();
      let storedContent = content.trim();
      let storedItems = checklistItems;

      if (isEncrypted) {
        if (!isUnlocked) {
          onVaultUnlockRequest();
          return;
        }
        const encrypted = await encryptPayload({
          title: storedTitle,
          content: storedContent,
          checklistItems: storedItems,
        });
        encryptedPayload = encrypted.encryptedPayload;
        iv = encrypted.iv;
        salt = encrypted.salt;
        // Obfuscate plaintext for Firestore storage
        storedTitle = '🔒 Encrypted Vault Note';
        storedContent = '';
        storedItems = [];
      }

      const newNote: Note = {
        id: noteId,
        title: storedTitle,
        content: storedContent,
        type: noteType,
        checklistItems: storedItems,
        color,
        isPinned,
        isArchived: false,
        isTrash: false,
        isEncrypted,
        encryptedPayload,
        iv,
        salt,
        sharing,
        groupId: groupId || null,
        sharedWithEmails: [],
        createdBy: user.uid,
        creatorEmail: user.email || 'anonymous',
        creatorName: user.displayName || 'Group Member',
        labels: [],
        createdAt: now,
        updatedAt: now,
      };

      await supabaseService.saveNote(newNote);
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      resetForm();
    }
  };

  const resetForm = () => {
    setIsExpanded(false);
    setTitle('');
    setContent('');
    setNoteType('text');
    setChecklistItems([]);
    setColor('default');
    setIsPinned(false);
    setIsEncrypted(false);
    setNewItemText('');
    setShowColorPicker(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4">
      <div
        ref={containerRef}
        className={`relative rounded-2xl transition-all duration-200 border ${
          colorCfg.key === 'default'
            ? 'bg-white dark:bg-[#202124] border-gray-200 dark:border-gray-700 shadow-keep'
            : `${colorCfg.lightBg} ${colorCfg.darkBg} ${colorCfg.borderLight} ${colorCfg.borderDark} shadow-keep`
        }`}
      >
        {!isExpanded ? (
          // Collapsed State
          <div
            onClick={() => handleExpand('text')}
            className="flex items-center justify-between px-4 py-3 cursor-text text-gray-500 dark:text-gray-400"
          >
            <span className="text-sm font-medium select-none">Take a note...</span>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => handleExpand('checklist')}
                title="New list"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-300"
              >
                <CheckSquare className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleExpand('text', true)}
                title="New encrypted note (Vault)"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-amber-600 dark:text-amber-400"
              >
                <Lock className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          // Expanded State
          <div className="p-4 space-y-3">
            {/* Top row: Title & Pin */}
            <div className="flex items-start justify-between gap-2">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-transparent text-base font-semibold placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? 'Unpin note' : 'Pin note'}
                className={`p-1.5 rounded-full transition-colors ${
                  isPinned
                    ? 'text-gray-900 dark:text-white bg-black/10 dark:bg-white/10'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Pin className={`w-5 h-5 ${isPinned ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Note Body: Text or Checklist */}
            {noteType === 'text' ? (
              <textarea
                ref={contentInputRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Take a note..."
                rows={3}
                className="w-full bg-transparent resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 focus:outline-none leading-relaxed"
              />
            ) : (
              <div className="space-y-2">
                {/* Active items */}
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleCheckItem(item.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span
                      className={`text-sm flex-1 ${
                        item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCheckItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add new item */}
                <div className="flex items-center gap-2 pt-1">
                  <Plus className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    ref={newItemInputRef}
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={handleAddChecklistItem}
                    placeholder="List item (press Enter to add)"
                    className="w-full bg-transparent text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center gap-1 relative">
                {/* Color Palette Toggle */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    title="Background options"
                    className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-600 dark:text-gray-300"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                  {showColorPicker && (
                    <ColorPalette
                      currentColor={color}
                      onSelectColor={(c) => {
                        setColor(c);
                        setShowColorPicker(false);
                      }}
                      onClose={() => setShowColorPicker(false)}
                    />
                  )}
                </div>

                {/* List / Text Toggle */}
                <button
                  type="button"
                  onClick={() => setNoteType(noteType === 'text' ? 'checklist' : 'text')}
                  title={noteType === 'text' ? 'Switch to Checklist' : 'Switch to Text'}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-600 dark:text-gray-300"
                >
                  {noteType === 'text' ? <CheckSquare className="w-4 h-4" /> : <Type className="w-4 h-4" />}
                </button>

                {/* Encrypted Vault Toggle */}
                <button
                  type="button"
                  onClick={handleToggleEncrypted}
                  title={isEncrypted ? 'Encrypted (AES-256-GCM)' : 'Encrypt note'}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isEncrypted
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-400/50'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isEncrypted ? 'Vault Encrypted' : 'Encrypt'}</span>
                </button>

                {/* Sharing Scope Selector */}
                <button
                  type="button"
                  onClick={() => setSharing(sharing === 'group' ? 'personal' : 'group')}
                  title="Toggle Sharing Scope"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    sharing === 'group'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {sharing === 'group' ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  <span>{sharing === 'group' ? 'Group Sync' : 'Personal (Me)'}</span>
                </button>
              </div>

              {/* Close / Save Button */}
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
