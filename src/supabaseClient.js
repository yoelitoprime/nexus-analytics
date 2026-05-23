import { createClient } from '@supabase/supabase-js'

// Pegamos los datos directamente para asegurar que funcione
const supabaseUrl = 'https://hakzxkycimmejljzkrpm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhha3p4a3ljaW1tZWpsanprcnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODQxNTYsImV4cCI6MjA4MzU2MDE1Nn0.rncwmHbdr-7y-n8dM1BnBwmqoN5Mp1-ljAssdYsPE-s' // Pega aquí tu key real

export const supabase = createClient(supabaseUrl, supabaseAnonKey)