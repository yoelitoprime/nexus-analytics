import { createClient } from '@supabase/supabase-js'

// Pegamos los datos directamente para asegurar que funcione
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)