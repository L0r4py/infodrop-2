// api/config.js
// VERSION FINALE - Configuration unique pour le BACKEND

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variables Supabase pour le backend manquantes (SUPABASE_URL, SUPABASE_SERVICE_KEY)');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);