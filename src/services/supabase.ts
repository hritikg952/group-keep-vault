import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Note, AppUser, Group, GroupMember } from '../types';

// --- Supabase Client Configuration ---
// Supports modern Supabase API keys (Publishable / Secret architecture)
// as well as backward-compatibility for legacy anon keys (phasing out by 2027).

const rawProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID?.trim() || '';
const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';

export function resolveSupabaseUrl(url?: string, projectId?: string): string {
  if (projectId) {
    if (projectId.startsWith('http://') || projectId.startsWith('https://')) {
      return projectId.replace(/\/+$/, '');
    }
    const cleanId = projectId.replace(/\.supabase\.co.*$/, '').trim();
    return `https://${cleanId}.supabase.co`;
  }
  if (url) {
    return url.replace(/\/+$/, '');
  }
  return '';
}

export const supabaseUrl = resolveSupabaseUrl(rawUrl, rawProjectId);

// In modern Supabase (Project Settings > API Keys):
// - "Publishable key" (sb_publishable_...) is safe for frontend clients and respects RLS.
// - "Secret key" (sb_secret_...) bypasses RLS and is strictly for backend servers.
// - Legacy "anon" JWT key is supported as a fallback until deprecation.
const modernPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || '';
const legacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const supabasePublishableKey = modernPublishableKey || legacyAnonKey;

// Security guard: Alert developer if Secret key is accidentally exposed on client
if (modernPublishableKey.startsWith('sb_secret_') || legacyAnonKey.startsWith('sb_secret_')) {
  console.error(
    '[Supabase Security Alert] A Secret key was provided in client environment variables! ' +
    'Secret keys bypass Row Level Security and must NEVER be used in frontend applications. ' +
    'Please use the Publishable key (sb_publishable_...) from Project Settings > API Keys instead.'
  );
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabasePublishableKey !== 'your-publishable-key' &&
  supabasePublishableKey !== 'your-anon-key' &&
  supabasePublishableKey !== 'placeholder'
);

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder'
);

// Helper to convert database row (snake_case) to Note (camelCase)
export function mapRowToNote(row: any): Note {
  const effectiveGroupId = row.group_id || null;
  return {
    id: row.id,
    title: row.title || '',
    content: row.content || '',
    type: row.type || 'text',
    checklistItems: row.checklist_items || [],
    color: row.color || 'default',
    isPinned: Boolean(row.is_pinned),
    isArchived: Boolean(row.is_archived),
    isTrash: Boolean(row.is_trash),
    isEncrypted: Boolean(row.is_encrypted),
    encryptedPayload: row.encrypted_payload || undefined,
    iv: row.iv || undefined,
    salt: row.salt || undefined,
    sharing: (row.sharing || 'personal'),
    groupId: effectiveGroupId,
    sharedWithEmails: row.shared_with_emails || [],
    createdBy: row.created_by,
    creatorEmail: row.creator_email || '',
    creatorName: row.creator_name || 'Group Member',
    labels: row.labels || [],
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

// Helper to convert Note (camelCase) to database row (snake_case)
export function mapNoteToRow(note: Note): Record<string, any> {
  const effectiveGroupId = note.groupId || null;
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    type: note.type,
    checklist_items: note.checklistItems || [],
    color: note.color,
    is_pinned: note.isPinned,
    is_archived: note.isArchived,
    is_trash: note.isTrash,
    is_encrypted: note.isEncrypted,
    encrypted_payload: note.encryptedPayload || null,
    iv: note.iv || null,
    salt: note.salt || null,
    sharing: note.sharing,
    group_id: effectiveGroupId,
    shared_with_emails: note.sharedWithEmails || [],
    created_by: note.createdBy,
    creator_email: note.creatorEmail,
    creator_name: note.creatorName,
    labels: note.labels || [],
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

class SupabaseService {
  private client: SupabaseClient = supabase;
  private realtimeChannel: RealtimeChannel | null = null;

  public isConfigured(): boolean {
    return isSupabaseConfigured;
  }

  // --- Auth Methods ---
  public onAuthChange(callback: (user: AppUser | null) => void): () => void {
    if (!this.isConfigured()) {
      callback(null);
      return () => {};
    }

    // Initial check
    this.client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        callback(this.formatUser(session.user));
      } else {
        callback(null);
      }
    });

    const { data: { subscription } } = this.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback(this.formatUser(session.user));
      } else {
        callback(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  private formatUser(sbUser: any): AppUser {
    return {
      id: sbUser.id,
      uid: sbUser.id,
      email: sbUser.email || null,
      displayName: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Group Member',
      photoURL: sbUser.user_metadata?.avatar_url || null,
      groupId: null,
    };
  }

  public async signInWithGoogle(): Promise<void> {
    const { error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }

  public async signInWithOtp(email: string): Promise<void> {
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }

  public async signOut(): Promise<void> {
    if (this.realtimeChannel) {
      await this.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  // --- Group Management ---
  public async getUserGroup(userId: string): Promise<{ group: Group | null; members: GroupMember[] }> {
    if (!this.isConfigured()) return { group: null, members: [] };

    // 1. Find membership for this user in group_members
    const { data: grpMem, error: grpMemErr } = await this.client
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (grpMemErr) {
      console.error('Error fetching group membership:', grpMemErr);
      return { group: null, members: [] };
    }

    if (!grpMem) {
      return { group: null, members: [] };
    }

    const groupId = grpMem.group_id;

    // 2. Fetch group details
    const { data: groupData, error: groupErr } = await this.client
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupErr || !groupData) {
      return { group: null, members: [] };
    }

    // 3. Fetch all members in this group
    const { data: membersData, error: membersErr } = await this.client
      .from('group_members')
      .select('*')
      .eq('group_id', groupId);

    if (membersErr) {
      console.error('Error fetching group members:', membersErr);
    }

    const group: Group = {
      id: groupData.id,
      name: groupData.name,
      inviteCode: groupData.invite_code,
      createdBy: groupData.created_by,
      createdAt: groupData.created_at,
    };

    const members: GroupMember[] = (membersData || []).map((m: any) => ({
      id: m.id,
      groupId: m.group_id,
      userId: m.user_id,
      userEmail: m.user_email,
      userName: m.user_name,
      role: m.role,
      joinedAt: m.joined_at,
    }));

    return { group, members };
  }

  public async createGroup(name: string, user: AppUser): Promise<Group> {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const inviteCode = `VAULT-${randomSuffix}`;

    const { data: grpData, error: grpError } = await this.client
      .from('groups')
      .insert({
        name: name.trim() || 'My Group Vault',
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single();

    if (grpError) throw grpError;

    const { error: memberError } = await this.client.from('group_members').insert({
      group_id: grpData.id,
      user_id: user.id,
      user_email: user.email,
      user_name: user.displayName,
      role: 'admin',
    });

    if (memberError) throw memberError;

    return {
      id: grpData.id,
      name: grpData.name,
      inviteCode: grpData.invite_code,
      createdBy: grpData.created_by,
      createdAt: grpData.created_at,
    };
  }

  public async joinGroupByCode(inviteCode: string, user: AppUser): Promise<Group> {
    const cleanCode = inviteCode.trim().toUpperCase();

    const { data: grpData, error: grpError } = await this.client
      .from('groups')
      .select('*')
      .ilike('invite_code', cleanCode)
      .single();

    if (grpError || !grpData) {
      throw new Error('Group not found with that invite code. Please check and try again.');
    }

    const { error: joinError } = await this.client
      .from('group_members')
      .upsert({
        group_id: grpData.id,
        user_id: user.id,
        user_email: user.email,
        user_name: user.displayName,
        role: 'member',
      }, { onConflict: 'group_id,user_id' });

    if (joinError) throw joinError;

    return {
      id: grpData.id,
      name: grpData.name,
      inviteCode: grpData.invite_code,
      createdBy: grpData.created_by,
      createdAt: grpData.created_at,
    };
  }

  public async leaveGroup(groupId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('group_members')
      .delete()
      .match({ group_id: groupId, user_id: userId });

    if (error) throw error;
  }

  // --- Real-time Notes Syncing ---
  public subscribeToNotes(
    _user: AppUser,
    callback: (notes: Note[]) => void
  ): () => void {
    if (!this.isConfigured()) {
      callback([]);
      return () => {};
    }

    const fetchNotes = async () => {
      // PostgreSQL Row Level Security handles filtering automatically:
      // Returns own notes + group-shared notes in user's group + email-shared notes.
      const { data, error } = await this.client
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes from Supabase:', error);
        return;
      }

      const notes: Note[] = (data || []).map(mapRowToNote);

      // Sort: pinned first, then newest updatedAt
      notes.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });

      callback(notes);
    };

    // Initial fetch
    fetchNotes();

    // Setup Supabase Realtime channel
    const channel = this.client
      .channel('public:notes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    this.realtimeChannel = channel;

    return () => {
      this.client.removeChannel(channel);
    };
  }

  // --- Notes CRUD Operations ---
  public async saveNote(note: Note): Promise<void> {
    const row = mapNoteToRow(note);
    const { error } = await this.client
      .from('notes')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error saving note to Supabase:', error);
      throw error;
    }
  }

  public async updateNoteStatus(id: string, updates: Partial<Note>): Promise<void> {
    const dbUpdates: Record<string, any> = {
      updated_at: Date.now(),
    };

    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
    if (updates.isTrash !== undefined) dbUpdates.is_trash = updates.isTrash;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.sharing !== undefined) dbUpdates.sharing = updates.sharing;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.checklistItems !== undefined) dbUpdates.checklist_items = updates.checklistItems;
    if (updates.isEncrypted !== undefined) dbUpdates.is_encrypted = updates.isEncrypted;
    if (updates.encryptedPayload !== undefined) dbUpdates.encrypted_payload = updates.encryptedPayload;
    if (updates.iv !== undefined) dbUpdates.iv = updates.iv;
    if (updates.salt !== undefined) dbUpdates.salt = updates.salt;
    if (updates.labels !== undefined) dbUpdates.labels = updates.labels;

    const { error } = await this.client
      .from('notes')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating note in Supabase:', error);
      throw error;
    }
  }

  public async deleteNotePermanently(id: string): Promise<void> {
    const { error } = await this.client
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note from Supabase:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();
