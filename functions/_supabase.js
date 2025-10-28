import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  SUPABASE_URL,         // injected from env
  SUPABASE_ANON_KEY
);
