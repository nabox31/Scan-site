// Supabase configuration
const SUPABASE_URL = 'https://nxyqhjzurtgpxewrbcrz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SKxA_esV9-e_d7J3qbe3gg_4Hnce4W_'; // Replace with your actual anon key

// Initialize Supabase client
let supabaseClient = null;

try {
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.error('Failed to initialize Supabase:', e);
}

// Export for use in other modules
window.db = supabaseClient;
