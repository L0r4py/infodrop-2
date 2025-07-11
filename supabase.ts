// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test de connexion
export const testConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('news')
            .select('count', { count: 'exact' });

        if (error) {
            console.error('Erreur de connexion Supabase:', error);
            return false;
        }

        console.log('✅ Connexion Supabase réussie !');
        return true;
    } catch (err) {
        console.error('Erreur:', err);
        return false;
    }
};