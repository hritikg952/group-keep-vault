# Group Keep & Vault 🛡️📝

A minimal, modern note-taking web app inspired by Google Keep, designed for private group collaboration with **selective syncing**, **relational multi-group isolation with PostgreSQL Row-Level Security (RLS)**, and **Zero-Knowledge client-side encryption (AES-256-GCM)** for passwords and secrets.

---

## ✨ Features

- **Google Keep Minimalist UI**:
  - Expanding *"Take a note..."* box with quick checklist / vault actions
  - Responsive masonry grid view and compact list view
  - Authentic Google Keep pastel color palette (Coral, Peach, Sand, Mint, Sage, Fog, Storm, Dusk, Blossom, Clay)
  - Pinned notes & Others sections
  - Interactive checklists with strikethrough and item completion
  - Dark mode and light mode
  - Search across titles, content, checklist items, and tags
  - Archive & Trash with restore and permanent deletion

- **Selective Syncing & Relational Groups**:
  - **Group Shared**: Notes sync live in real-time across connected group members (groceries, team tasks, Wi-Fi info, shared lists)
  - **Personal (Private)**: Notes only accessible to your account, enforced at the database layer via PostgreSQL RLS
  - **Group Identifier & Invite Codes**: Create a group or join one with a shareable invite code (e.g., `VAULT-8X92`)
  - **Supabase Realtime**: Instant WebSocket replication across devices without polling

- **Zero-Knowledge Client-Side Encryption (AES-256-GCM)**:
  - Confidential notes, passwords, and sensitive information are encrypted **inside the browser** before ever leaving your device
  - Keys derived via **PBKDF2 (100,000 iterations, SHA-256)** from your Group Vault Passphrase
  - The database only receives and stores scrambled Base64 ciphertext
  - Instant vault lock and unlock in browser session memory

- **Hybrid Authentication**:
  - Google OAuth sign-in
  - Instant passwordless Magic Link / Email sign-in

---

## 🚀 Quick Start

### 1. Install & Run Locally
```bash
npm install
npm run dev
```

### 2. Connect Your Supabase Backend
1. Create a free project at [Supabase](https://supabase.com).
2. In your Supabase project dashboard, open the **SQL Editor**.
3. Open [`supabase/schema.sql`](./supabase/schema.sql) in this repository, paste its contents into the SQL Editor, and click **Run**.
   - This sets up the `groups`, `group_members`, and `notes` tables (or safely migrates existing `families` and `family_members` tables without data loss).
   - It configures Row Level Security (RLS) policies.
   - It enables Realtime WebSocket replication on the `notes` and `group_members` tables.
4. Obtain your project credentials from your Supabase dashboard:
   - **Project ID**: In **Project Settings > General**, copy your **Reference ID / Project ID** (e.g. `abcdefghijklmnop`). You can also copy the full Project URL from **Project Settings > API**.
   - **Publishable Key**: In **Project Settings > API Keys**, copy your **Publishable key** (`sb_publishable_...`).
   > **Note on Supabase API Key Modernization**: Supabase is phasing out legacy JWT-based `anon` / `service_role` keys by 2027. Modern projects use explicit `sb_publishable_` keys for client applications (subject to Row Level Security) and `sb_secret_` keys for server-side environments. Never expose a secret key in frontend client code!
5. Create a `.env` file in the project root:
   ```env
   # Project ID from Project Settings > General
   VITE_SUPABASE_PROJECT_ID=your-project-id
   # Alternatively: VITE_SUPABASE_URL=https://your-project-id.supabase.co

   # Modern Publishable Key from Project Settings > API Keys
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-publishable-key

   # Legacy fallback (if still using legacy anon key):
   # VITE_SUPABASE_ANON_KEY=your-legacy-anon-key
   ```
6. (Optional) Under **Authentication > Providers** in Supabase, enable Google OAuth if you wish to use Google Sign-In, or use the built-in Magic Link / Email authentication out of the box.

---

## 🔒 Security Architecture

### 1. Zero-Knowledge Client Encryption
```
[Plaintext Note / Password]
            │
            ▼ (Browser Web Crypto API)
  [PBKDF2 100k + AES-256-GCM]  <─── [Group Passphrase] (kept strictly in browser memory)
            │
            ▼ (Encrypted Ciphertext)
  [Supabase PostgreSQL Cloud] (Only stores scrambled bytes; server has zero knowledge)
```

### 2. PostgreSQL Row-Level Security (RLS)
Unlike traditional document databases where security rules can crash queries when permissions differ across documents, PostgreSQL Row-Level Security operates as a native filter at the database engine level:

* **Personal Notes**: Enforced so that `created_by = auth.uid()`. Even if another group member queries the database, PostgreSQL filters out notes that do not belong to them.
* **Group Notes**: Accessible only if `sharing IN ('group', 'family')` and the current user is recorded in the `group_members` table for that `group_id`.
* **Invited Shares**: Accessible if the user's email is explicitly listed in `shared_with_emails`.
