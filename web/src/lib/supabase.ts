import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ttczgbfxntvgqdbclruh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Y3pnYmZ4bnR2Z3FkYmNscnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODA4NDEsImV4cCI6MjEwNjQ1Njg0MX0.z0FPVJOeZSgkFkORLNNOqMwUs0c_rwFRKW7sIGfaZk8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
