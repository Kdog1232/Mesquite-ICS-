import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurationError =
  !url || !anonKey
    ? 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    : null;

/** Browser client using only the public key. Authorization is enforced by Auth and RLS. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
