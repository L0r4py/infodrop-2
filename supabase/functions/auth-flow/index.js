import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { email, inviteCode } = await req.json()
    
    // Basic validation
    if (!email) {
      throw new Error('Email requis')
    }
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@example.com'
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuration manquante')
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const normalizedEmail = email.toLowerCase()
    
    console.log('Checking email:', normalizedEmail)
    
    // Check if admin
    if (normalizedEmail === adminEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Admin détecté',
          action: 'send_magic_link'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Check if user exists
    const { data: authData } = await supabase.auth.admin.listUsers()
    const users = authData?.users || []
    const userExists = users.some(u => u.email?.toLowerCase() === normalizedEmail)
    
    if (userExists) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Utilisateur existant',
          action: 'send_magic_link'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // New user - check invite code
    if (!inviteCode) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Code invitation requis pour créer un compte'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Check code in database
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', inviteCode.toUpperCase())
      .eq('is_active', true)
      .single()
    
    if (codeError || !codeData) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Code invitation invalide'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Check if code has uses left
    if (codeData.uses_count >= codeData.max_uses) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Code invitation épuisé'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Code is valid!
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Code valide',
        action: 'send_magic_link',
        validCode: inviteCode.toUpperCase()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || 'Erreur serveur'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})