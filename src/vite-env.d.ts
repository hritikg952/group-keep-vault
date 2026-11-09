/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Modern Supabase Configuration (Project Settings > General & API Keys)
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;

  // Legacy API Key (deprecated by Supabase by 2027)
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

