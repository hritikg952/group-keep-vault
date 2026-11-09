-- ==============================================================================
-- GROUP KEEP & VAULT: SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- CLEAN UP ANY LEGACY 'FAMILY' ARTIFACTS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.family_members CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;

-- 2. GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'My Group Vault',
    invite_code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast invite code lookups
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);

-- 3. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    user_name TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);

-- 4. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'checklist')),
    checklist_items JSONB DEFAULT '[]'::jsonb,
    color TEXT NOT NULL DEFAULT 'default',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_trash BOOLEAN NOT NULL DEFAULT false,
    is_encrypted BOOLEAN NOT NULL DEFAULT false,
    
    -- Client-Side AES-256-GCM zero-knowledge ciphertext
    encrypted_payload TEXT,
    iv TEXT,
    salt TEXT,
    
    -- Sharing & Group Scope
    sharing TEXT NOT NULL DEFAULT 'personal',
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    shared_with_emails TEXT[] DEFAULT '{}'::text[],
    
    -- Creator info
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_email TEXT,
    creator_name TEXT,
    
    -- Metadata
    labels TEXT[] DEFAULT '{}'::text[],
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Clean up any legacy column or values if table previously existed
DO $$
BEGIN
    -- If notes had legacy family_id column, drop it
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'family_id'
    ) THEN
        ALTER TABLE public.notes DROP COLUMN family_id;
    END IF;

    -- Update any legacy 'family' sharing values to 'group'
    UPDATE public.notes SET sharing = 'group' WHERE sharing = 'family';

    -- Ensure sharing constraint strictly allows 'personal', 'group', 'specific'
    ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_sharing_check;
    ALTER TABLE public.notes ADD CONSTRAINT notes_sharing_check 
        CHECK (sharing IN ('personal', 'group', 'specific'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_notes_created_by ON public.notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_group_id ON public.notes(group_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & HELPER FUNCTIONS
-- ==============================================================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- SECURITY DEFINER HELPER FUNCTIONS
-- (Bypasses RLS recursion on group_members to avoid Postgres error 42P17)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.group_members
        WHERE group_id = _group_id
          AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.groups
        WHERE id = _group_id
          AND created_by = auth.uid()
    );
$$;

-- Drop previous policies to ensure clean updates
DROP POLICY IF EXISTS "Users can view their family or lookup by invite code" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.groups;
DROP POLICY IF EXISTS "Family members can update family" ON public.groups;
DROP POLICY IF EXISTS "Users can view their group or lookup by invite code" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group members can update group" ON public.groups;

DROP POLICY IF EXISTS "Members can view other members in their family" ON public.group_members;
DROP POLICY IF EXISTS "Users can join a family" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave or creator can remove members" ON public.group_members;
DROP POLICY IF EXISTS "Members can view other members in their group" ON public.group_members;
DROP POLICY IF EXISTS "Users can join a group" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave or group creator can remove members" ON public.group_members;

DROP POLICY IF EXISTS "Users can read own notes, family notes, or email-shared notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes or family notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes or family notes" ON public.notes;
DROP POLICY IF EXISTS "Users can read own notes, group notes, or email-shared notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes or group notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes or group notes" ON public.notes;

-- ------------------------------------------------------------------------------
-- A. GROUPS POLICIES
-- ------------------------------------------------------------------------------

-- Allow users to view a group if they created it, are a member, or look up by invite code
CREATE POLICY "Users can view their group or lookup by invite code"
ON public.groups
FOR SELECT
TO authenticated
USING (
    created_by = auth.uid() OR
    public.is_group_member(id) OR
    invite_code IS NOT NULL
);

-- Allow authenticated users to create groups
CREATE POLICY "Authenticated users can create groups"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Allow creator or group members to update group name
CREATE POLICY "Group members can update group"
ON public.groups
FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid() OR
    public.is_group_member(id)
);

-- ------------------------------------------------------------------------------
-- B. GROUP MEMBERS POLICIES
-- ------------------------------------------------------------------------------

-- Allow users to view members of their own groups
CREATE POLICY "Members can view other members in their group"
ON public.group_members
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    public.is_group_member(group_id)
);

-- Allow authenticated users to join a group (insert their own membership record)
CREATE POLICY "Users can join a group"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to leave or group creator to remove members
CREATE POLICY "Users can leave or group creator can remove members"
ON public.group_members
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid() OR
    public.is_group_creator(group_id)
);

-- ------------------------------------------------------------------------------
-- C. NOTES POLICIES (THE CORE ZERO-TRUST ACCESS LOGIC)
-- ------------------------------------------------------------------------------

-- SELECT: You can view a note if:
-- 1. You created it (personal or shared), OR
-- 2. It is shared with 'group' and you belong to that group, OR
-- 3. Your email is explicitly in shared_with_emails
CREATE POLICY "Users can read own notes, group notes, or email-shared notes"
ON public.notes
FOR SELECT
TO authenticated
USING (
    created_by = auth.uid() OR
    (
        sharing = 'group' AND 
        public.is_group_member(group_id)
    ) OR
    (
        auth.jwt() ->> 'email' IS NOT NULL AND 
        (auth.jwt() ->> 'email') = ANY(shared_with_emails)
    )
);

-- INSERT: Authenticated users can insert their own notes
CREATE POLICY "Users can create their own notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- UPDATE: You can update notes if:
-- 1. You created it, OR
-- 2. It is a group-shared note in your group
CREATE POLICY "Users can update own notes or group notes"
ON public.notes
FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid() OR
    (
        sharing = 'group' AND 
        public.is_group_member(group_id)
    )
)
WITH CHECK (
    created_by = auth.uid() OR
    (
        sharing = 'group' AND 
        public.is_group_member(group_id)
    )
);

-- DELETE: Delete own notes or group notes
CREATE POLICY "Users can delete own notes or group notes"
ON public.notes
FOR DELETE
TO authenticated
USING (
    created_by = auth.uid() OR
    (
        sharing = 'group' AND 
        public.is_group_member(group_id)
    )
);

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================

-- Enable Realtime publication for notes and group memberships
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
