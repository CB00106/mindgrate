import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { mindop_id, source_csv_name } = await req.json()

    // Validate required parameters
    if (!mindop_id || !source_csv_name) {
      return new Response(
        JSON.stringify({ 
          error: 'Parámetros requeridos: mindop_id y source_csv_name' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Starting document deletion for user ${user.id}, mindop ${mindop_id}, file ${source_csv_name}`)

    // First, verify that the user owns the MindOp
    const { data: mindopData, error: mindopError } = await supabaseClient
      .from('mindops')
      .select('id, user_id')
      .eq('id', mindop_id)
      .eq('user_id', user.id)
      .single()

    if (mindopError || !mindopData) {
      console.error('MindOp ownership verification failed:', mindopError)
      return new Response(
        JSON.stringify({ 
          error: 'MindOp no encontrado o acceso denegado' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if there are any chunks for this file before attempting deletion
    const { data: existingChunks, error: checkError } = await supabaseClient
      .from('mindop_document_chunks')
      .select('id')
      .eq('mindop_id', mindop_id)
      .eq('source_csv_name', source_csv_name)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing chunks:', checkError)
      return new Response(
        JSON.stringify({ 
          error: 'Error al verificar el archivo',
          details: checkError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!existingChunks || existingChunks.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Archivo no encontrado en el MindOp especificado' 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Delete all chunks for this file
    const { data: deletedChunks, error: deleteError } = await supabaseClient
      .from('mindop_document_chunks')
      .delete()
      .eq('mindop_id', mindop_id)
      .eq('source_csv_name', source_csv_name)
      .select('id')

    if (deleteError) {
      console.error('Error deleting chunks:', deleteError)
      return new Response(
        JSON.stringify({ 
          error: 'Error al eliminar el archivo',
          details: deleteError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const deletedCount = deletedChunks?.length || 0
    console.log(`Successfully deleted ${deletedCount} chunks for file ${source_csv_name} from mindop ${mindop_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Archivo "${source_csv_name}" eliminado exitosamente`,
        deleted_chunks: deletedCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error in delete-document function:', error)
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
