import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface MindopSearchResult {
  id: string;
  mindop_name: string;
  mindop_description: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use GET.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization')
    console.log('🔑 Authorization header presente:', !!authHeader)
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract search term from URL parameters
    const url = new URL(req.url)
    const searchTerm = url.searchParams.get('searchTerm')
    
    console.log('🔍 Search term recibido:', searchTerm)

    if (!searchTerm || searchTerm.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role key for broader access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
     
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the JWT token and get user (to ensure authenticated access)
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !userData.user) {
      console.error('Auth error:', userError?.message)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Authenticated user: ${userData.user.id}`)

    // Search for MindOps using case-insensitive ILIKE
    console.log('Searching for MindOps with term:', searchTerm)
    
    const { data: mindops, error: searchError } = await supabaseAdmin
      .from('mindops')
      .select('id, mindop_name, mindop_description')
      .ilike('mindop_name', `%${searchTerm}%`)
      .limit(20) // Limit results to avoid overwhelming the UI

    if (searchError) {
      console.error('Search error:', searchError)
      return new Response(
        JSON.stringify({ error: 'Search failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${mindops?.length || 0} MindOps matching search term`)

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        results: mindops || [],
        total: mindops?.length || 0,
        searchTerm: searchTerm,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error occurred',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To invoke:
curl -i --location --request GET 'http://localhost:54321/functions/v1/search-mindops?searchTerm=marketing' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
*/
