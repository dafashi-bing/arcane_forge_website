import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key';

// Public client for client-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service client for server-side usage with elevated permissions
export const supabaseService = createClient(supabaseUrl, supabaseServiceKey); 