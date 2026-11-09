import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  encryptNoteContent, 
  decryptNoteContent, 
  createVaultCanary, 
  verifyVaultCanary 
} from '../crypto/vault';
import { Note, DecryptedNoteContent } from '../types';

interface VaultContextType {
  isUnlocked: boolean;
  passphrase: string | null;
  unlockVault: (pass: string) => Promise<{ success: boolean; error?: string }>;
  lockVault: () => void;
  setupVault: (newPass: string) => Promise<void>;
  isVaultConfigured: boolean;
  decryptNote: (note: Note) => Promise<DecryptedNoteContent>;
  encryptPayload: (payload: DecryptedNoteContent, salt?: string) => Promise<{ encryptedPayload: string; iv: string; salt: string }>;
}

const STORAGE_KEY_CANARY = 'group_keep_vault_canary';
const LEGACY_STORAGE_KEY_CANARY = 'family_keep_vault_canary';

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [isVaultConfigured, setIsVaultConfigured] = useState(false);

  useEffect(() => {
    // Check if vault canary exists in localStorage (group or legacy family key)
    const canary = localStorage.getItem(STORAGE_KEY_CANARY) || localStorage.getItem(LEGACY_STORAGE_KEY_CANARY);
    if (canary) {
      setIsVaultConfigured(true);
    } else {
      // Default setup for demo: initialize with demo passphrase "groupvault123"
      createVaultCanary('groupvault123').then((c) => {
        localStorage.setItem(STORAGE_KEY_CANARY, JSON.stringify(c));
        setIsVaultConfigured(true);
      });
    }
  }, []);

  const setupVault = async (newPass: string) => {
    const canary = await createVaultCanary(newPass);
    localStorage.setItem(STORAGE_KEY_CANARY, JSON.stringify(canary));
    setIsVaultConfigured(true);
    setPassphrase(newPass);
    setIsUnlocked(true);
  };

  const unlockVault = async (pass: string): Promise<{ success: boolean; error?: string }> => {
    const canaryStr = localStorage.getItem(STORAGE_KEY_CANARY) || localStorage.getItem(LEGACY_STORAGE_KEY_CANARY);
    if (!canaryStr) {
      // First time, treat this as setup
      await setupVault(pass);
      return { success: true };
    }

    try {
      const canary = JSON.parse(canaryStr);
      const isValid = await verifyVaultCanary(canary.canaryCipher, canary.iv, canary.salt, pass);
      if (isValid) {
        setPassphrase(pass);
        setIsUnlocked(true);
        return { success: true };
      } else {
        return { success: false, error: 'Incorrect Group Vault Passphrase. Please check and retry.' };
      }
    } catch {
      return { success: false, error: 'Failed to verify passphrase. Vault data might be corrupted.' };
    }
  };

  const lockVault = () => {
    setPassphrase(null);
    setIsUnlocked(false);
  };

  const decryptNote = async (note: Note): Promise<DecryptedNoteContent> => {
    if (!note.isEncrypted) {
      return {
        title: note.title,
        content: note.content,
        checklistItems: note.checklistItems,
      };
    }

    if (!isUnlocked || !passphrase) {
      throw new Error('Vault is locked. Unlock the vault with the group passphrase first.');
    }

    if (!note.encryptedPayload || !note.iv || !note.salt) {
      // Fallback if missing encryption metadata
      return {
        title: note.title,
        content: note.content,
        checklistItems: note.checklistItems,
      };
    }

    return await decryptNoteContent(note.encryptedPayload, note.iv, note.salt, passphrase);
  };

  const encryptPayload = async (payload: DecryptedNoteContent, existingSalt?: string) => {
    if (!passphrase) {
      throw new Error('Vault passphrase is not set. Please unlock or configure vault first.');
    }
    return await encryptNoteContent(payload, passphrase, existingSalt);
  };

  return (
    <VaultContext.Provider
      value={{
        isUnlocked,
        passphrase,
        unlockVault,
        lockVault,
        setupVault,
        isVaultConfigured,
        decryptNote,
        encryptPayload,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
