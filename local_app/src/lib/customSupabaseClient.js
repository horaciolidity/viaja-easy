import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wlssatbhutozvryrejzv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsc3NhdGJodXRvenZyeXJlanp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MzU0NTYsImV4cCI6MjA2NTAxMTQ1Nn0.NMKmPaWfId3y9Tv2U-jshk7uhDKts0IxAE4YyneeU8w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);