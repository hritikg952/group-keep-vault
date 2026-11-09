import React, { useState, useEffect } from 'react';
import { Note, ChecklistItem } from '../types';
import { getColorConfig } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { supabaseService } from '../services/supabase';
import { ColorPalette } from './ColorPalette';
import { 
  Pin, 
  Lock, 
  Unlock, 
  Palette, 
  Archive, 
  Trash2, 
  Users, 
  User, 
  RotateCcw, 
  ShieldAlert,
  CheckCircle2,
  Circle
} from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onVaultUnlockRequest: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onClick,
  onVaultUnlockRequest,
}) => {
  const { user } = useAuth();
  const { isUnlocked, decryptNote } = useVault();
  const isAuthor = !note.createdBy || user?.uid === note.createdBy;
  const [decryptedTitle, setDecryptedTitle] = useState(note.title);
  const [decryptedContent, setDecryptedContent] = useState(note.content);
  const [decryptedChecklist, setDecryptedChecklist] = useState<ChecklistItem[]>(note.checklistItems || []);
  const [isDecryptionError, setIsDecryptionError] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorCfg = getColorConfig(note.color);

  // Decrypt if note is encrypted and vault is unlocked
  useEffect(() => {
    let isMounted = true;
    if (note.isEncrypted) {
      if (isUnlocked) {
        decryptNote(note)
          .then((res) => {
            if (isMounted) {
              setDecryptedTitle(res.title);
              setDecryptedContent(res.content);
              setDecryptedChecklist(res.checklistItems || []);
              setIsDecryptionError(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setIsDecryptionError(true);
            }
          });
      } else {
        setDecryptedTitle(note.title || '🔒 Encrypted Note');
        setDecryptedContent('');
        setDecryptedChecklist([]);
      }
    } else {
      setDecryptedTitle(note.title);
      setDecryptedContent(note.content);
      setDecryptedChecklist(note.checklistItems || []);
    }
    return () => {
      isMounted = false;
    };
  }, [note, isUnlocked, decryptNote]);

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    supabaseService.updateNoteStatus(note.id, { isPinned: !note.isPinned });
  };

  const handleToggleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    supabaseService.updateNoteStatus(note.id, { isArchived: !note.isArchived });
  };

  const handleToggleTrash = (e: React.MouseEvent) => {
    e.stopPropagation();
    supabaseService.updateNoteStatus(note.id, { isTrash: !note.isTrash });
  };

  const handlePermanentDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Permanently delete this note? This cannot be undone.')) {
      supabaseService.deleteNotePermanently(note.id);
    }
  };

  const handleChangeColor = (colorKey: string) => {
    supabaseService.updateNoteStatus(note.id, { color: colorKey });
    setShowColorPicker(false);
  };

  const isGroupShared = note.sharing === 'group';

  const handleToggleSharing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthor) return;
    const nextSharing = isGroupShared ? 'personal' : 'group';
    supabaseService.updateNoteStatus(note.id, { sharing: nextSharing });
  };

  const handleCheckItemToggle = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (note.isEncrypted && !isUnlocked) {
      onVaultUnlockRequest();
      return;
    }
    const updated = decryptedChecklist.map((it) =>
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    setDecryptedChecklist(updated);
    // Persist
    if (!note.isEncrypted) {
      supabaseService.saveNote(
        { ...note, checklistItems: updated, updatedAt: Date.now() }
      );
    }
  };

  const isLockedEncrypted = note.isEncrypted && !isUnlocked;

  return (
    <div
      onClick={() => {
        if (isLockedEncrypted) {
          onVaultUnlockRequest();
        } else {
          onClick();
        }
      }}
      className={`group relative rounded-2xl border transition-all duration-200 cursor-default select-none mb-4 break-inside-avoid overflow-hidden ${
        colorCfg.key === 'default'
          ? 'bg-white dark:bg-[#202124] border-gray-200 dark:border-gray-700/80 hover:shadow-keep-hover'
          : `${colorCfg.lightBg} ${colorCfg.darkBg} ${colorCfg.borderLight} ${colorCfg.borderDark} hover:shadow-keep-hover`
      }`}
    >
      {/* Top badges: Pin & Badges */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          {/* Title or Locked Banner */}
          {decryptedTitle ? (
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-snug line-clamp-2">
              {decryptedTitle}
            </h3>
          ) : (
            <div />
          )}

          {/* Pin Button */}
          {!note.isTrash && (
            <button
              type="button"
              onClick={handleTogglePin}
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
              className={`p-1.5 rounded-full transition-opacity ${
                note.isPinned
                  ? 'opacity-100 text-gray-900 dark:text-white bg-black/10 dark:bg-white/10'
                  : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Note Content / Checklist */}
        <div className="mt-2.5">
          {isLockedEncrypted ? (
            <div className="py-4 px-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1.5 cursor-pointer">
              <Lock className="w-5 h-5 mx-auto text-amber-600 dark:text-amber-400" />
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Encrypted Vault Note
              </div>
              <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                Click to unlock with Group Passphrase
              </div>
            </div>
          ) : isDecryptionError ? (
            <div className="p-3 bg-red-100/50 dark:bg-red-950/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Decryption error. Check passphrase.
            </div>
          ) : note.type === 'checklist' ? (
            <div className="space-y-1.5">
              {decryptedChecklist.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => handleCheckItemToggle(e, item.id)}
                  className="flex items-center gap-2 text-xs text-gray-800 dark:text-gray-200 group/item cursor-pointer"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-gray-400 shrink-0 group-hover/item:text-blue-500" />
                  )}
                  <span className={`truncate ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                    {item.text}
                  </span>
                </div>
              ))}
              {decryptedChecklist.length > 6 && (
                <div className="text-[11px] text-gray-400 pt-1">
                  +{decryptedChecklist.length - 6} more items
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed line-clamp-6">
              {decryptedContent}
            </p>
          )}
        </div>
      </div>

      {/* Creator & Privacy Tags Footer */}
      <div className="px-4 py-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-1.5">
          {isGroupShared ? (
            isAuthor ? (
              <button
                type="button"
                onClick={handleToggleSharing}
                title="Click to switch to Personal (private)"
                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
              >
                <Users className="w-3 h-3" /> Group
              </button>
            ) : (
              <span
                title={`Shared with Group • Only ${note.creatorName} can change privacy`}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40 cursor-default"
              >
                <Users className="w-3 h-3" /> Group
              </span>
            )
          ) : (
            isAuthor ? (
              <button
                type="button"
                onClick={handleToggleSharing}
                title="Click to switch to Group Sync"
                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <User className="w-3 h-3" /> Personal
              </button>
            ) : (
              <span
                title={`Personal Note • Only ${note.creatorName} can change privacy`}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50 cursor-default"
              >
                <User className="w-3 h-3" /> Personal
              </span>
            )
          )}

          {note.isEncrypted && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              Vault
            </span>
          )}
        </div>

        <div className="text-[10px] opacity-75 truncate max-w-[100px]" title={`By ${note.creatorName}`}>
          {note.creatorName.split(' ')[0]}
        </div>
      </div>

      {/* Hover Action Toolbar */}
      <div className="px-3 py-1.5 bg-black/5 dark:bg-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 relative">
          {!note.isTrash && (
            <>
              {/* Color Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  title="Change color"
                  className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
                {showColorPicker && (
                  <ColorPalette
                    currentColor={note.color}
                    onSelectColor={handleChangeColor}
                    onClose={() => setShowColorPicker(false)}
                  />
                )}
              </div>

              {/* Archive */}
              <button
                type="button"
                onClick={handleToggleArchive}
                title={note.isArchived ? 'Unarchive' : 'Archive'}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {note.isTrash ? (
            <>
              {/* Restore */}
              <button
                type="button"
                onClick={handleToggleTrash}
                title="Restore note"
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              {/* Delete Forever */}
              <button
                type="button"
                onClick={handlePermanentDelete}
                title="Delete forever"
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            /* Send to Trash */
            <button
              type="button"
              onClick={handleToggleTrash}
              title="Delete note"
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
