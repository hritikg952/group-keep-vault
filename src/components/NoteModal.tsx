import React, { useState, useEffect, useRef } from 'react';
import { Note, ChecklistItem, SharingScope } from '../types';
import { getColorConfig } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { supabaseService } from '../services/supabase';
import { ColorPalette } from './ColorPalette';
import { 
  Pin, 
  Lock, 
  Palette, 
  CheckSquare, 
  Type, 
  Trash2, 
  Users, 
  User, 
  Plus, 
  X,
  Circle,
  CheckCircle2
} from 'lucide-react';

interface NoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onVaultUnlockRequest: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  note,
  isOpen,
  onClose,
  onVaultUnlockRequest,
}) => {
  const { user } = useAuth();
  const { isUnlocked, decryptNote, encryptPayload } = useVault();
  const isAuthor = !note?.createdBy || user?.uid === note?.createdBy;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [noteType, setNoteType] = useState<'text' | 'checklist'>('text');
  const [color, setColor] = useState('default');
  const [isPinned, setIsPinned] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [sharing, setSharing] = useState<SharingScope>('group');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!note || !isOpen) return;

    setColor(note.color || 'default');
    setIsPinned(note.isPinned);
    setIsEncrypted(note.isEncrypted);
    setSharing(note.sharing);
    setNoteType(note.type);

    if (note.isEncrypted) {
      if (isUnlocked) {
        decryptNote(note)
          .then((res) => {
            setTitle(res.title);
            setContent(res.content);
            setChecklistItems(res.checklistItems || []);
          })
          .catch(() => {
            setTitle(note.title);
            setContent('');
            setChecklistItems([]);
          });
      } else {
        setTitle(note.title);
        setContent('');
        setChecklistItems([]);
      }
    } else {
      setTitle(note.title);
      setContent(note.content);
      setChecklistItems(note.checklistItems || []);
    }
  }, [note, isOpen, isUnlocked, decryptNote]);

  // Handle Escape key to save and close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSaveAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, content, checklistItems, isEncrypted, sharing, color, isPinned, isUnlocked]);

  if (!isOpen || !note) return null;

  const colorCfg = getColorConfig(color);

  const handleSaveAndClose = async () => {
    if (!note) return;

    try {
      let storedTitle = title.trim();
      let storedContent = content.trim();
      let storedItems = checklistItems;
      let encryptedPayload = note.encryptedPayload;
      let iv = note.iv;
      let salt = note.salt;

      if (isEncrypted) {
        if (!isUnlocked) {
          onVaultUnlockRequest();
          return;
        }
        const enc = await encryptPayload(
          {
            title: storedTitle,
            content: storedContent,
            checklistItems: storedItems,
          },
          note.salt
        );
        encryptedPayload = enc.encryptedPayload;
        iv = enc.iv;
        salt = enc.salt;
        storedTitle = '🔒 Encrypted Vault Note';
        storedContent = '';
        storedItems = [];
      } else {
        encryptedPayload = undefined;
        iv = undefined;
        salt = undefined;
      }

      const updated: Note = {
        ...note,
        title: storedTitle,
        content: storedContent,
        type: noteType,
        checklistItems: storedItems,
        color,
        isPinned,
        isEncrypted,
        encryptedPayload,
        iv,
        salt,
        // Privacy / sharing settings can only be changed by the original author
        sharing: isAuthor ? sharing : note.sharing,
        updatedAt: Date.now(),
      };

      await supabaseService.saveNote(updated);
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      onClose();
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

  const handleDeleteNote = async () => {
    if (!note) return;
    await supabaseService.updateNoteStatus(note.id, { isTrash: true });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleSaveAndClose}
    >
      <div
        ref={containerRef}
        className={`w-full max-w-xl rounded-2xl shadow-2xl border transition-all duration-200 overflow-hidden ${
          colorCfg.key === 'default'
            ? 'bg-white dark:bg-[#202124] border-gray-200 dark:border-gray-700'
            : `${colorCfg.lightBg} ${colorCfg.darkBg} ${colorCfg.borderLight} ${colorCfg.borderDark}`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4">
          {/* Top Header: Title and Pin */}
          <div className="flex items-start justify-between gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-transparent text-lg font-semibold placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white focus:outline-none"
            />
            <div className="flex items-center gap-1">
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
              <button
                type="button"
                onClick={handleSaveAndClose}
                title="Save and close"
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          {isEncrypted && !isUnlocked ? (
            <div className="py-8 px-4 text-center rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <Lock className="w-8 h-8 mx-auto text-amber-600 dark:text-amber-400" />
              <div className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                This note is encrypted with your Group Vault Passphrase
              </div>
              <button
                type="button"
                onClick={onVaultUnlockRequest}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Unlock Vault to Edit
              </button>
            </div>
          ) : noteType === 'text' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Note text..."
              rows={8}
              className="w-full bg-transparent resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 focus:outline-none leading-relaxed"
            />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {/* Uncompleted items */}
              {checklistItems
                .filter((item) => !item.completed)
                .map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <button
                      type="button"
                      onClick={() => handleToggleCheckItem(item.id)}
                      className="text-gray-400 hover:text-blue-500"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChecklistItems(
                          checklistItems.map((it) =>
                            it.id === item.id ? { ...it, text: val } : it
                          )
                        );
                      }}
                      className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteCheckItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

              {/* Add item */}
              <div className="flex items-center gap-2 pt-1 border-t border-black/5 dark:border-white/5">
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

              {/* Completed items */}
              {checklistItems.some((it) => it.completed) && (
                <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-1.5">
                  <div className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                    Completed items ({checklistItems.filter((it) => it.completed).length})
                  </div>
                  {checklistItems
                    .filter((item) => item.completed)
                    .map((item) => (
                      <div key={item.id} className="flex items-center gap-2 group opacity-60">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckItem(item.id)}
                          className="text-blue-600"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-sm line-through text-gray-500 dark:text-gray-400">
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCheckItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Footer toolbar */}
          <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1.5 relative">
              {/* Color */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  title="Background options"
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300"
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

              {/* Type switch */}
              <button
                type="button"
                onClick={() => setNoteType(noteType === 'text' ? 'checklist' : 'text')}
                title="Toggle checklist/text"
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300"
              >
                {noteType === 'text' ? <CheckSquare className="w-4 h-4" /> : <Type className="w-4 h-4" />}
              </button>

              {/* Encryption toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!isEncrypted) {
                    if (!isUnlocked) onVaultUnlockRequest();
                    setIsEncrypted(true);
                  } else {
                    setIsEncrypted(false);
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isEncrypted
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-400/50'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isEncrypted ? 'Vault Encrypted' : 'Encrypt'}</span>
              </button>

              {/* Sharing scope */}
              {isAuthor ? (
                <button
                  type="button"
                  onClick={() => setSharing(sharing === 'group' ? 'personal' : 'group')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    sharing === 'group'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {sharing === 'group' ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  <span>{sharing === 'group' ? 'Group Sync' : 'Personal'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title={`Only the author (${note.creatorName}) can change privacy settings`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40 cursor-not-allowed opacity-80"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Group Sync</span>
                  <span className="text-[10px] opacity-75 font-normal">({note.creatorName.split(' ')[0]})</span>
                </button>
              )}

              {/* Delete / Move to Trash */}
              <button
                type="button"
                onClick={handleDeleteNote}
                title="Move to trash"
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors shadow-sm"
            >
              Close & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
