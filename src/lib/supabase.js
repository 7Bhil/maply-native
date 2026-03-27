import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// TODO: Remplacer par tes propres identifiants Supabase
const supabaseUrl = 'https://horearhenbzbmtuvlxzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvcmVhcmhlbmJ6Ym10dXZseHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTU0OTAsImV4cCI6MjA4OTUzMTQ5MH0.2Ikm_Iv_wDbDeVmb1pyXsPnNZfCiS9z6QjrFmF38wjc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
