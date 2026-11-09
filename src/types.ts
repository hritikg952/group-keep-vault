export type NoteType = 'text' | 'checklist';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type SharingScope = 'personal' | 'group' | 'specific';

export interface Note {
  id: string;
  title: string;
  content: string; // Plain text or JSON string of checklist if not encrypted
  type: NoteType;
  checklistItems?: ChecklistItem[];
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  isTrash: boolean;
  isEncrypted: boolean;
  
  // Encryption metadata (AES-256-GCM)
  encryptedPayload?: string; // Base64 ciphertext of JSON { title, content, checklistItems }
  iv?: string; // Base64 12-byte IV
  salt?: string; // Base64 16-byte salt for key derivation
  
  // Sharing & Group Scope
  sharing: SharingScope;
  groupId?: string | null;
  sharedWithEmails: string[];
  
  // Creator info
  createdBy: string;
  creatorEmail: string;
  creatorName: string;
  
  // Timestamps & tags
  labels: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DecryptedNoteContent {
  title: string;
  content: string;
  checklistItems?: ChecklistItem[];
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string | null;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface AppUser {
  id: string;
  uid: string; // for compatibility with existing code
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  groupId?: string | null;
}

export interface KeepColor {
  key: string;
  name: string;
  lightBg: string;
  darkBg: string;
  borderLight: string;
  borderDark: string;
}
