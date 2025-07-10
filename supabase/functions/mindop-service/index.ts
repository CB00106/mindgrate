import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"
import { corsHeaders } from "../_shared/cors.ts"

// ===== INTERFACES =====

interface MindopRecord {
  id: string;
  user_id: string;
  mindop_name: string;
  mindop_description?: string;
  created_at: string;
}

interface RelevantChunk {
  id: string;
  content: string;
  similarity: number;
  source_csv_name: string;
  created_at: string;
  metadata?: any;
}

interface CollaborationTask {
  id: string;
  requester_mindop_id: string;
  target_mindop_id: string;
  query: string;
  status: 'pending' | 'processing_by_target' | 'target_processing_complete' | 'completed' | 'failed';
  response?: string;
  created_at: string;
  updated_at: string;
}

interface ConversationMessage {
  id: string;
  mindop_id: string;
  user_message: string;
  assistant_response: string;
  created_at: string;
}

interface OpenAIEmbeddingResponse {
  data: {
    embedding: number[]
  }[]
}

// ===== ENHANCED RAG FUNCTIONS =====

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  
  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)
  
  if (normA === 0 || normB === 0) {
    return 0
  }
  
  return dotProduct / (normA * normB)
}

/**
 * Calculate real similarity for chunks using embeddings
 */
async function calculateRealSimilarity(
  queryEmbedding: number[],
  chunks: any[]
): Promise<RelevantChunk[]> {
  console.log(`🧮 Calculando similarity real para ${chunks.length} chunks`)
  
  const chunksWithSimilarity: RelevantChunk[] = []
  
  for (const chunk of chunks) {
    try {
      // Generar embedding para el chunk
      const chunkEmbedding = await generateEmbedding(chunk.content)
      
      // Calcular cosine similarity
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding)
      
      chunksWithSimilarity.push({
        id: chunk.id,
        content: chunk.content,
        source_csv_name: chunk.source_csv_name,
        created_at: chunk.created_at,
        metadata: chunk.metadata,
        similarity: similarity
      })
      
      console.log(`  ✓ Chunk ${chunk.id}: similarity = ${similarity.toFixed(3)}`)
    } catch (error) {
      console.error(`  ❌ Error calculando similarity para chunk ${chunk.id}:`, error)
      
      // Fallback con similarity baja
      chunksWithSimilarity.push({
        id: chunk.id,
        content: chunk.content,
        source_csv_name: chunk.source_csv_name,
        created_at: chunk.created_at,
        metadata: chunk.metadata,
        similarity: 0.1 // Similarity muy baja como fallback
      })
    }
  }
  
  // Ordenar por similarity descendente
  return chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity)
}

/**
 * Enhanced chunk retrieval with multi-file support and better relevance scoring
 */
async function retrieveChunksBySimilarity(
  supabase: any,
  queryEmbedding: number[],
  mindopId: string,
  limit: number = 30,
  similarityThreshold: number = 0.3
): Promise<RelevantChunk[]> {
  try {
    console.log(`🔍 Retrieving chunks for mindop ${mindopId}`)
    console.log(`📊 Query embedding dimensions: ${queryEmbedding.length}`)
    
    // Primero verificar que hay chunks
    const { count } = await supabase
      .from('mindop_document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('mindop_id', mindopId)
    
    console.log(`📊 Total chunks en la base de datos: ${count}`)
    
    if (!count || count === 0) {
      console.error('❌ No hay chunks para este mindop')
      return []
    }
    
    // OPCIÓN 1: Si la función RPC existe, usarla
    try {
      console.log('🔄 Intentando búsqueda con RPC...')
      const { data: rpcChunks, error: rpcError } = await supabase
        .rpc('match_mindop_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: similarityThreshold,
          match_count: limit,
          p_mindop_id: mindopId
        })
      
      if (!rpcError && rpcChunks && rpcChunks.length > 0) {
        console.log(`✅ RPC exitoso: ${rpcChunks.length} chunks encontrados`)
        return rpcChunks
      }
      
      if (rpcError) {
        console.log('⚠️ RPC falló:', rpcError.message)
      }
    } catch (e) {
      console.log('⚠️ RPC no disponible, usando fallback')
    }
      // OPCIÓN 2: Búsqueda directa con similarity real
    console.log('📋 Usando búsqueda directa con similarity real...')
    
    const { data: allChunks, error: directError } = await supabase
      .from('mindop_document_chunks')
      .select('id, content, source_csv_name, created_at, metadata')
      .eq('mindop_id', mindopId)
      .order('created_at', { ascending: false })
      .limit(limit * 3) // Obtener más chunks para mejor selección
    
    if (directError) {
      console.error('❌ Error en búsqueda directa:', directError)
      throw directError
    }
    
    if (!allChunks || allChunks.length === 0) {
      console.error('❌ No se encontraron chunks con búsqueda directa')
      return []
    }
    
    console.log(`✅ Búsqueda directa encontró ${allChunks.length} chunks`)
    
    // Si tenemos embedding de la query, calcular similarity real
    if (queryEmbedding && queryEmbedding.length > 0) {
      console.log('🧮 Calculando similarity real con embeddings...')
      
      // Limitar a un número razonable de chunks para calcular similarity
      const chunksToProcess = allChunks.slice(0, Math.min(50, allChunks.length))
      
      const chunksWithRealSimilarity = await calculateRealSimilarity(queryEmbedding, chunksToProcess)
      
      // Filtrar por umbral de similarity
      const filteredChunks = chunksWithRealSimilarity.filter(chunk => 
        chunk.similarity >= similarityThreshold
      )
      
      if (filteredChunks.length > 0) {
        console.log(`✅ ${filteredChunks.length} chunks superan el umbral de similarity (${similarityThreshold})`)
        
        // Log de los mejores resultados
        filteredChunks.slice(0, 5).forEach((chunk, idx) => {
          console.log(`  ${idx + 1}. ${chunk.source_csv_name}: ${chunk.similarity.toFixed(3)}`)
        })
        
        return filteredChunks.slice(0, limit)
      } else {
        console.log('⚠️ Ningún chunk supera el umbral, usando fallback con similarity más baja')
        // Reducir umbral y tomar los mejores
        const bestChunks = chunksWithRealSimilarity.slice(0, limit)
        return bestChunks
      }
    }
    
    // Fallback: agrupar por archivo para diversidad (similarity simulada)
    console.log('📁 Fallback: agrupando por archivo con similarity simulada...')
    const chunksByFile = new Map<string, any[]>()
    allChunks.forEach(chunk => {
      const fileName = chunk.source_csv_name || 'unknown'
      if (!chunksByFile.has(fileName)) {
        chunksByFile.set(fileName, [])
      }
      chunksByFile.get(fileName)!.push(chunk)
    })
    
    console.log(`📁 Chunks agrupados en ${chunksByFile.size} archivos`)
    
    // Seleccionar chunks balanceados de cada archivo
    const selectedChunks: any[] = []
    const chunksPerFile = Math.max(3, Math.floor(limit / chunksByFile.size))
    
    chunksByFile.forEach((chunks, fileName) => {
      console.log(`  - ${fileName}: ${chunks.length} chunks disponibles`)
      const fileChunks = chunks.slice(0, chunksPerFile)
      selectedChunks.push(...fileChunks)
    })
    
    // Agregar similarity simulada pero más realista
    const finalChunks = selectedChunks.slice(0, limit).map((chunk, index) => {
      // Similarity simulada basada en posición y diversidad
      let baseSimilarity = 0.8 - (index * 0.02)
      
      // Boost para chunks más recientes
      const daysSinceCreation = (Date.now() - new Date(chunk.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreation < 30) {
        baseSimilarity += 0.1
      }
      
      return {
        id: chunk.id,
        content: chunk.content,
        source_csv_name: chunk.source_csv_name,
        created_at: chunk.created_at,
        metadata: chunk.metadata,
        similarity: Math.min(0.95, baseSimilarity) // Cap a 0.95
      }
    })
    
    console.log(`🎯 Retornando ${finalChunks.length} chunks finales`)
    
    // Log de muestra para debug
    if (finalChunks.length > 0) {
      console.log('📄 Muestra del primer chunk:')
      console.log(`  - Archivo: ${finalChunks[0].source_csv_name}`)
      console.log(`  - Contenido (primeros 200 chars): ${finalChunks[0].content.substring(0, 200)}...`)
    }
    
    return finalChunks
    
  } catch (error) {
    console.error('💥 Error crítico en retrieveChunksBySimilarity:', error)
    
    // Último fallback: obtener CUALQUIER chunk para confirmar que hay datos
    try {
      const { data: anyChunk } = await supabase
        .from('mindop_document_chunks')
        .select('*')
        .eq('mindop_id', mindopId)
        .limit(1)
        .single()
      
      if (anyChunk) {
        console.log('✅ Confirmado: SÍ hay chunks en la BD para este mindop')
        console.log('📄 Ejemplo de chunk:', {
          id: anyChunk.id,
          source: anyChunk.source_csv_name,
          content_preview: anyChunk.content.substring(0, 100) + '...'
        })
      }
    } catch (e) {
      console.log('❌ No se pudo obtener ningún chunk de ejemplo')
    }
    
    throw error
  }
}

/**
 * Web search capability using Google Custom Search API
 */
async function performWebSearch(query: string): Promise<string> {
  try {
    const apiKey = Deno.env.get('GOOGLE_CUSTOM_SEARCH_API_KEY')
    const searchEngineId = Deno.env.get('GOOGLE_CUSTOM_SEARCH_ENGINE_ID')
    
    if (!apiKey || !searchEngineId) {
      console.log('⚠️ Google Custom Search not configured, skipping web search')
      return ''
    }
    
    console.log(`🌐 Performing web search for: ${query}`)
    
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`
    
    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      console.error('Google Search API error:', response.status, response.statusText)
      return ''
    }
    
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      console.log('No search results found')
      return ''
    }
    
    // Format search results
    const formattedResults = data.items
      .slice(0, 3) // Top 3 results
      .map((item: any, index: number) => {
        const title = item.title || 'Sin título'
        const snippet = item.snippet || 'Sin descripción'
        const link = item.link || ''
        
        return `**Resultado ${index + 1}: ${title}**
${snippet}
Fuente: ${link}`
      })
      .join('\n\n')
    
    return `## Información adicional de la web:\n\n${formattedResults}`
    
  } catch (error) {
    console.error('Error in web search:', error)
    return ''
  }
}

/**
 * Generate embedding using OpenAI API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found')
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data: OpenAIEmbeddingResponse = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Enhanced RAG pipeline with better context handling and web search
 */
async function orchestrateRAG(
  supabase: any,
  genAI: GoogleGenerativeAI,
  query: string,
  mindopId: string,
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  try {
    console.log(`🚀 Starting RAG pipeline for mindop ${mindopId}`)
    console.log(`📝 Query: "${query}"`)
    
    // Step 1: Verificar que hay datos
    const { count } = await supabase
      .from('mindop_document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('mindop_id', mindopId)
    
    console.log(`📊 Total chunks disponibles: ${count}`)
    
    if (!count || count === 0) {
      return "No encuentro información en tu base de conocimiento. Por favor, asegúrate de haber cargado archivos en tu MindOp."
    }
    
    // Step 2: Generate query embedding (con fallback)
    let queryEmbedding: number[] = []
    try {
      console.log('🔍 Generando embedding...')
      queryEmbedding = await generateEmbedding(query)
      console.log('✅ Embedding generado')
    } catch (e) {
      console.log('⚠️ Fallo el embedding, continuando sin él')
    }
    
    // Step 3: Retrieve relevant chunks (con o sin embedding)
    console.log('📚 Recuperando chunks relevantes...')
    const relevantChunks = await retrieveChunksBySimilarity(
      supabase, 
      queryEmbedding, 
      mindopId, 
      30, 
      0.3
    )
    
    console.log(`📊 Chunks recuperados: ${relevantChunks.length}`)
    
    if (relevantChunks.length === 0) {
      return "No pude recuperar información de tu base de conocimiento. Esto puede ser un problema temporal. Por favor, intenta de nuevo o contacta soporte."
    }
      // Step 4: Analizar calidad de la similarity
    const avgSimilarity = relevantChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / relevantChunks.length
    const highQualityChunks = relevantChunks.filter(chunk => chunk.similarity > 0.7)
    const mediumQualityChunks = relevantChunks.filter(chunk => chunk.similarity >= 0.4 && chunk.similarity <= 0.7)
    
    console.log(`📊 Análisis de calidad:`)
    console.log(`  - Similarity promedio: ${avgSimilarity.toFixed(3)}`)
    console.log(`  - Chunks alta calidad (>0.7): ${highQualityChunks.length}`)
    console.log(`  - Chunks calidad media (0.4-0.7): ${mediumQualityChunks.length}`)
    
    // Step 5: Estrategia de contexto basada en calidad
    let contextChunks: typeof relevantChunks = []
    let qualityLevel = ''
    
    if (highQualityChunks.length >= 5) {
      // Usar solo chunks de alta calidad
      contextChunks = highQualityChunks.slice(0, 10)
      qualityLevel = 'alta'
    } else if (highQualityChunks.length > 0) {
      // Combinar alta y media calidad
      contextChunks = [
        ...highQualityChunks,
        ...mediumQualityChunks.slice(0, 10 - highQualityChunks.length)
      ]
      qualityLevel = 'mixta'
    } else {
      // Usar los mejores disponibles
      contextChunks = relevantChunks.slice(0, 10)
      qualityLevel = 'disponible'
    }
    
    console.log(`📊 Estrategia de contexto: ${qualityLevel} (${contextChunks.length} chunks)`)
    
    // Step 6: Agrupar por fuente y crear contexto enriquecido
    const chunksBySource = new Map<string, typeof contextChunks>()
    contextChunks.forEach(chunk => {
      const source = chunk.source_csv_name || 'desconocido'
      if (!chunksBySource.has(source)) {
        chunksBySource.set(source, [])
      }
      chunksBySource.get(source)!.push(chunk)
    })
    
    console.log(`📁 Información de ${chunksBySource.size} fuentes diferentes`)
    
    // Step 7: Crear contexto estructurado con información de relevancia
    let context = `INFORMACIÓN DISPONIBLE EN TU BASE DE CONOCIMIENTO (Calidad: ${qualityLevel.toUpperCase()}):\n\n`
    
    // Ordenar fuentes por mejor similarity promedio
    const sourcesByQuality = Array.from(chunksBySource.entries())
      .map(([source, chunks]) => ({
        source,
        chunks,
        avgSimilarity: chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / chunks.length
      }))
      .sort((a, b) => b.avgSimilarity - a.avgSimilarity)
    
    sourcesByQuality.forEach(({ source, chunks }) => {
      const sourceAvg = chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / chunks.length
      context += `📄 Del archivo "${source}" (Relevancia: ${sourceAvg.toFixed(2)}):\n\n`
      
      // Ordenar chunks por similarity dentro de la fuente
      const sortedChunks = chunks.sort((a, b) => b.similarity - a.similarity)
      
      sortedChunks.forEach((chunk, idx) => {
        // Incluir indicador de relevancia para el LLM
        const relevanceIndicator = chunk.similarity > 0.8 ? '🎯' : 
                                 chunk.similarity > 0.6 ? '📍' : '📌'
        context += `${relevanceIndicator} ${chunk.content}\n\n`
      })
      context += "---\n\n"
    })
      // Step 8: Generar respuesta con prompt mejorado
    console.log('✨ Generando respuesta...')
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const prompt = `Eres un asistente especializado en Mindgrate y su producto MindOps. 
    Tienes acceso a información detallada sobre la empresa que SOLO debes usar cuando el 
    usuario pregunte específicamente sobre Mindgrate, MindOps, o temas relacionados.. 

CONSULTA DEL USUARIO: "${query}"

${context}

<mindgrate_context>
INFORMACIÓN DE LA EMPRESA:
- Nombre: Mindgrate
- Producto principal: MindOps (AI-Driven Operations)
- CEO: César Briones (cesarbriones@mindgrate.net 
- COO: Jorge Luis Superano Calzada
- CFO: Luis Alberto Aguirre Cortez
- CMO: Eduardo López
- Sitio web: Mindgrate.net

PROBLEMA QUE RESUELVE:
- La comunicación fragmentada entre equipos es el mayor obstáculo en la gestión de proyectos moderna
- Las empresas desperdician 10-15% de su inversión total en trabajo desalineado
- Los proyectos de TI exceden presupuestos en 45% promedio y entregan 56% menos valor prometido

SOLUCIÓN - MindOps:
- Plataforma de gestión de proyectos impulsada por IA con agentes colaborativos especializados
- Cada departamento (Planning, Resources, Procurement, Quality) tiene su propio agente de IA
- Modelo de "Follow" con aprobación humana para colaboración segura entre agentes
- Construido sobre protocolos estándar abiertos: A2A (Agent-to-Agent) y MCP (Model Context Protocol)

DIFERENCIADORES CLAVE:
1. Inteligencia Distribuida: Sistema multi-agente que refleja la estructura organizacional real
2. Colaboración Gobernada: Modelo "Follow" con aprobación humana auditable
3. Interoperabilidad Futura: Construido nativamente sobre estándares abiertos

MERCADO OBJETIVO:
- Empresas de alta complejidad (500+ empleados) con portafolios de proyectos de $50M+
- Startups tech en alto crecimiento (Series A+) que necesitan escalar operaciones
- Foco inicial: México y Latinoamérica
- Industrias: Automotriz, Aeroespacial, Manufactura Avanzada, Servicios Financieros, FinTech, SaaS

MODELO DE NEGOCIO:
- SaaS modular con estrategia "Land and Expand"
- Pricing basado en: número de asientos, agentes activos, volumen de uso
- Tiers: Professional, Business, Enterprise
- ROI demostrado: >14x (reduce 15% de desperdicio en portafolios de $50M)

TRACCIÓN:
- MVP funcional desarrollado con características core validadas
- Mecanismo "Follow" implementado y probado
- Comunicación A2A en vivo funcionando
- En fase activa de validación de mercado

COMPETENCIA:
- Se diferencia de Asana, Monday.com, ClickUp por ofrecer inteligencia con control
- No es "IA en una caja" sino una plataforma estratégica de colaboración gobernada

FINANCIAMIENTO:
- Levantando ronda Pre-Seed de $250,000 USD
- Runway de 12-18 meses
- Uso: 65% desarrollo producto, 15% GTM, 10% operaciones, 10% contingencia
- Objetivos: Probar Product-Market Fit, validar modelo comercial, demostrar escalabilidad

MÉTRICAS OBJETIVO:
- DAU/MAU ≥ 25%
- NPS ≥ 40
- MRR $4k-$12k USD
- Conversión Piloto a Contrato Anual ≥ 30%
- LTV/CAC > 3x
</mindgrate_context>

REGLAS DE USO DEL CONTEXTO DE MINDGRATE:
1. SOLO menciona información de Mindgrate cuando el usuario pregunte específicamente sobre:
   - La empresa Mindgrate
   - MindOps o productos de Mindgrate
   - Soluciones de gestión de proyectos con IA colaborativa
   - El equipo de Mindgrate
   - Inversión o financiamiento en Mindgrate

2. NO menciones a Mindgrate si el usuario:
   - Hace preguntas generales sobre gestión de proyectos
   - Pregunta sobre otras herramientas o competidores
   - Busca información general sobre IA o tecnología

3. Cuando hables de Mindgrate:
   - Sé preciso con los datos y cifras
   - Mantén un tono profesional pero accesible
   - Enfócate en el valor y beneficios para el usuario
   - Si no tienes información específica solicitada, indícalo claramente

Ahora, responde a la siguiente consulta del usuario. Si no es sobre Mindgrate, usa tu conocimiento general y el contexto proporcionado:

CONSULTA: ${query}

FILOSOFÍA DE RESPUESTA:
- Sé NATURAL y CONVERSACIONAL, no robótico
- ASUME INTENCIONES POSITIVAS - interpreta las preguntas de manera flexible
- SÉ ÚTIL PRIMERO - proporciona valor incluso con información parcial
- EVITA ser pedante con errores menores de ortografía o términos
- NO te disculpes excesivamente ni menciones limitaciones constantemente

CÓMO MANEJAR LAS CONSULTAS:

1. **Si tienes información relevante (aunque sea parcial):**
   - Compártela de manera útil y contextualizada
   - Complementa con conocimiento general relacionado
   - Sugiere aspectos adicionales que podrían interesar

2. **Si la pregunta es ambigua o tiene errores:**
   - Interpreta la intención más probable
   - Responde a lo que probablemente quisieron preguntar
   - Solo clarifica si es realmente necesario

3. **Si tienes información limitada:**
   - Comparte lo que SÍ sabes de manera positiva
   - Complementa con información relacionada útil
   - Solo menciona limitaciones si es crítico para la respuesta

4. **Estilo de comunicación:**
   - Usa transiciones naturales y conectores
   - Varía tu estructura de respuesta
   - Incluye ejemplos cuando sea útil
   - Mantén un tono amigable y profesional

CONSULTA DEL USUARIO: ${query}

CONTEXTO ADICIONAL:
${context}

INDICADORES DE RELEVANCIA:
🎯 = Información muy relevante (alta confianza)
📍 = Información relevante (buena confianza)  
📌 = Información relacionada (confianza moderada)

INSTRUCCIONES PARA TU RESPUESTA:
1. **PRIORIZA la información marcada con 🎯** - Esta es la más relevante a la consulta
2. **USA información de 📍** como contexto de apoyo
3. **CONSIDERA información de 📌** solo si complementa lo anterior
4. **CITA datos específicos** - números, fechas, nombres, detalles exactos
5. **MENCIONA las fuentes** cuando uses información de archivos específicos
6. **SI LA INFORMACIÓN ES LIMITADA**: 
   - Usa lo que tienes de manera creativa pero honesta
   - Indica qué información adicional sería útil
   - NO inventes datos que no estén en los documentos
7. **ESTRUCTURA tu respuesta** con secciones claras cuando sea apropiado

OBJETIVOS:
- Proporciona respuestas útiles y accionables
- Mantén un tono conversacional y profesional
- Enfócate en resolver la consulta del usuario
- Si hay información contradictoria, indícalo claramente

GENERA UNA RESPUESTA:
- Que fluya naturalmente
- Que maximice el valor para el usuario
- Que se sienta como una conversación con un experto
- Que use la información disponible de manera creativa
- Que solo mencione limitaciones si es absolutamente necesario

Responde de manera completa y útil:`

    const result = await model.generateContent(prompt)
    return result.response.text()
    
  } catch (error) {
    console.error('💥 Error en RAG pipeline:', error)
    return `Error al procesar tu consulta. Por favor intenta de nuevo. Detalles: ${error.message}`
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Get user's MindOp by ID with validation
 */
async function getUserMindOp(supabase: any, mindopId: string, userId: string): Promise<MindopRecord | null> {
  try {
    const { data, error } = await supabase
      .from('mindops')
      .select('*')
      .eq('id', mindopId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching MindOp:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getUserMindOp:', error)
    return null
  }
}

/**
 * Get conversation history for context
 */
async function getConversationHistory(supabase: any, mindopId: string, limit: number = 5): Promise<ConversationMessage[]> {
  try {
    // Primero intentar obtener conversaciones del usuario con este mindop
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('mindop_id', mindopId)
      .order('updated_at', { ascending: false })
      .limit(1)
    
    if (convError || !conversations || conversations.length === 0) {
      console.log('⚠️ No conversations found for this mindop')
      return []
    }
    
    // Obtener mensajes de la conversación más reciente
    const { data: messages, error: msgError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversations[0].id)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (msgError || !messages) {
      console.log('⚠️ No messages found in conversation')
      return []
    }
    
    // Convertir al formato esperado
    const formattedMessages: ConversationMessage[] = messages.map(msg => ({
      id: msg.id,
      mindop_id: mindopId,
      user_message: msg.sender_role === 'user' ? msg.content : '',
      assistant_response: msg.sender_role === 'agent' ? msg.content : '',
      created_at: msg.created_at
    })).filter(msg => msg.user_message || msg.assistant_response)
    
    return formattedMessages.reverse() // Return in chronological order
  } catch (error) {
    console.error('⚠️ Error in getConversationHistory:', error)
    return []
  }
}

/**
 * Save conversation message with table detection
 */
async function saveConversationMessage(
  supabase: any, 
  mindopId: string, 
  userMessage: string, 
  assistantResponse: string,
  conversationId?: string
): Promise<string | null> {
  try {
    // Si no hay conversation_id, crear o buscar una conversación
    let activeConversationId = conversationId
    
    if (!activeConversationId) {
      // Buscar conversación activa o crear una nueva
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('mindop_id', mindopId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (existingConv) {
        activeConversationId = existingConv.id
      } else {
        // Crear nueva conversación
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            mindop_id: mindopId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '')
          })
          .select('id')
          .single()
        
        if (!createError && newConv) {
          activeConversationId = newConv.id
          console.log('✅ Nueva conversación creada:', activeConversationId)
        }
      }
    }
    
    if (!activeConversationId) {
      console.error('⚠️ Could not create or find conversation')
      return null
    }
    
    // Guardar mensajes del usuario y asistente
    const messages = [
      {
        conversation_id: activeConversationId,
        sender_role: 'user',
        content: userMessage
      },
      {
        conversation_id: activeConversationId,
        sender_role: 'agent',
        content: assistantResponse
      }
    ]
    
    const { error } = await supabase
      .from('conversation_messages')
      .insert(messages)
    
    if (error) {
      console.error('⚠️ Error saving conversation messages:', error)
      return null
    } else {
      // Actualizar timestamp de la conversación
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversationId)
      
      console.log('✅ Conversación guardada exitosamente:', activeConversationId)
      return activeConversationId
    }
  } catch (error) {
    console.error('⚠️ Error in saveConversationMessage:', error)
    return null
  }
}

// ===== MODE HANDLERS =====

/**
 * Handle local query mode with enhanced capabilities
 */
async function handleLocalQuery(
  supabase: any,
  genAI: GoogleGenerativeAI,
  mindopId: string,
  query: string,
  userId: string
): Promise<Response> {
  try {
    console.log(`🏠 LOCAL MODE: Enhanced processing for mindop_id=${mindopId}`)
    
    // Validate MindOp ownership
    const mindop = await getUserMindOp(supabase, mindopId, userId)
    if (!mindop) {
      return new Response(
        JSON.stringify({ error: 'MindOp not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get conversation history for better context
    const conversationHistory = await getConversationHistory(supabase, mindopId)
      // Execute enhanced RAG pipeline
    const response = await orchestrateRAG(
      supabase,
      genAI,
      query,
      mindopId,
      conversationHistory
    )
      // Save conversation
    const conversationId = await saveConversationMessage(supabase, mindopId, query, response)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        response,
        conversation_id: conversationId,
        metadata: {
          mindop_name: mindop.mindop_name,
          mode: 'local',
          enhanced: true
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('💥 Error in local query:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process query',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Handle synchronous collaboration mode with full RAG
 */
async function handleSyncCollaboration(
  supabase: any,
  genAI: GoogleGenerativeAI,
  requesterMindopId: string,
  targetMindopId: string,
  query: string,
  userId: string
): Promise<Response> {
  try {
    console.log(`🤝 SYNC COLLABORATION: Enhanced processing`)
    console.log(`📊 Requester MindOp: ${requesterMindopId}`)
    console.log(`🎯 Target MindOp: ${targetMindopId}`)
    console.log(`💬 Query: "${query}"`)
    
    // Get target MindOp details
    const { data: targetMindop, error: mindopError } = await supabase
      .from('mindops')
      .select('*')
      .eq('id', targetMindopId)
      .single()
    
    if (mindopError || !targetMindop) {
      console.error('❌ Target MindOp not found:', mindopError)
      return new Response(
        JSON.stringify({ error: 'Target MindOp not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Target MindOp found: "${targetMindop.mindop_name}" (Owner: ${targetMindop.user_id})`)

    // Check if target MindOp has any data (chunks)
    const { count: chunkCount, error: countError } = await supabase
      .from('mindop_document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('mindop_id', targetMindopId)

    console.log(`📊 Chunks available for target MindOp: ${chunkCount}`)

    if (countError) {
      console.error('❌ Error checking chunks:', countError)
      return new Response(
        JSON.stringify({ 
          error: 'Error accessing target MindOp data',
          details: countError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If no chunks found, provide helpful feedback
    if (!chunkCount || chunkCount === 0) {
      console.log('⚠️ No chunks found for target MindOp - providing helpful message')
      
      const helpfulMessage = `El MindOp "${targetMindop.mindop_name}" aún no tiene documentos cargados o procesados. 

Para colaborar con este MindOp, necesita:
1. Cargar archivos (CSV, documentos, etc.)
2. Esperar a que se procesen los datos
3. Intentar la colaboración nuevamente

Si crees que debería haber datos disponibles, contacta al propietario del MindOp o verifica que los archivos se hayan cargado correctamente.`

      // Log the collaboration attempt even when no data is found
      await supabase
        .from('mindop_collaboration_tasks')
        .insert({
          requester_mindop_id: requesterMindopId,
          target_mindop_id: targetMindopId,
          requester_user_query: query,
          target_mindop_response: helpfulMessage,
          status: 'completed_no_data',
          metadata: {
            mode: 'sync',
            processed_at: new Date().toISOString(),
            issue: 'no_chunks_available',
            chunk_count: 0
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true,
          response: helpfulMessage,
          metadata: {
            target_mindop_name: targetMindop.mindop_name,
            mode: 'sync_collaboration',
            issue: 'no_data_available',
            chunk_count: 0,
            enhanced: true
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get sample chunk info for debugging
    const { data: sampleChunk } = await supabase
      .from('mindop_document_chunks')
      .select('id, source_csv_name, created_at')
      .eq('mindop_id', targetMindopId)
      .limit(1)
      .single()

    if (sampleChunk) {
      console.log(`📄 Sample chunk info:`, {
        id: sampleChunk.id,
        source: sampleChunk.source_csv_name,
        created: sampleChunk.created_at
      })
    }

    // Execute full RAG pipeline for target MindOp
    console.log('🚀 Executing RAG pipeline...')
    const response = await orchestrateRAG(
      supabase,
      genAI,
      query,
      targetMindopId,
      []
    )
    
    console.log(`✅ RAG response generated (${response.length} characters)`)
    
    // Enhanced collaboration logging
    await supabase
      .from('mindop_collaboration_tasks')
      .insert({
        requester_mindop_id: requesterMindopId,
        target_mindop_id: targetMindopId,
        requester_user_query: query,
        target_mindop_response: response,
        status: 'response_received_by_requester',
        metadata: {
          mode: 'sync',
          processed_at: new Date().toISOString(),
          chunk_count: chunkCount,
          response_length: response.length,
          target_mindop_name: targetMindop.mindop_name,
          sample_chunk_id: sampleChunk?.id
        }
      })
      
    return new Response(
      JSON.stringify({ 
        success: true,
        response,
        metadata: {
          target_mindop_name: targetMindop.mindop_name,
          mode: 'sync_collaboration',
          chunk_count: chunkCount,
          enhanced: true
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('💥 Error in sync collaboration:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process collaboration query',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Handle asynchronous collaboration task processing
 */
async function handleAsyncTask(
  supabase: any,
  genAI: GoogleGenerativeAI,
  taskId: string
): Promise<Response> {
  try {
    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('mindop_collaboration_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('status', 'pending_target_processing')
      .single()
    
    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found or not pending' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Update task status
    await supabase
      .from('mindop_collaboration_tasks')
      .update({ 
        status: 'processing_by_target',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
    
    try {
      // Get target MindOp details
      const { data: targetMindop } = await supabase
        .from('mindops')
        .select('*')
        .eq('id', task.target_mindop_id)
        .single()
        // Execute enhanced RAG pipeline
      const response = await orchestrateRAG(
        supabase,
        genAI,
        task.requester_user_query,
        task.target_mindop_id,
        []
      )
      
      // Update task with response
      await supabase
        .from('mindop_collaboration_tasks')
        .update({ 
          status: 'target_processing_complete',
          target_mindop_response: response,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Task completed successfully',
          response
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (ragError) {
      // Update task status to failed
      await supabase
        .from('mindop_collaboration_tasks')
        .update({ 
          status: 'target_processing_failed',
          updated_at: new Date().toISOString(),
          metadata: {
            error: ragError.message
          }
        })
        .eq('id', taskId)
      
      throw ragError
    }
  } catch (error) {
    console.error('Error in async task processing:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process async task' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ===== MAIN HANDLER =====

serve(async (req) => {
  // Handle CORS preflight requests - SOLUCIÓN IMPLEMENTADA
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,  // Agregar status 200 explícito
      headers: corsHeaders 
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!
    
    // Log environment variables status (without exposing values)
    console.log('🔧 Environment check:', {
      supabase_configured: !!supabaseUrl && !!supabaseServiceKey,
      gemini_configured: !!geminiApiKey,
      openai_configured: !!Deno.env.get('OPENAI_API_KEY'),
      google_search_configured: !!Deno.env.get('GOOGLE_CUSTOM_SEARCH_API_KEY') && !!Deno.env.get('GOOGLE_CUSTOM_SEARCH_ENGINE_ID')
    })    // Initialize Supabase client with SERVICE ROLE for full access
    // This bypasses RLS and allows access to all data needed for collaborations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Create a separate client for user authentication validation
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('authorization')! },
      },
    })
    
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    
    // Get user from auth header using the user-specific client
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { data: { user }, error: authError } = await userSupabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Parse request body with error handling
    let body
    try {
      body = await req.json()
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
      const { mode, mindop_id, query, target_mindop_id, task_id } = body
    
    // Validate required mode parameter
    if (!mode) {
      return new Response(
        JSON.stringify({ error: 'mode parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Route to appropriate handler based on mode
    switch (mode) {
      case 'local':
        if (!mindop_id || !query) {
          return new Response(
            JSON.stringify({ error: 'mindop_id and query are required for local mode' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await handleLocalQuery(supabase, genAI, mindop_id, query, user.id)
      
      case 'sync_collaboration':
        if (!mindop_id || !target_mindop_id || !query) {
          return new Response(
            JSON.stringify({ error: 'mindop_id, target_mindop_id, and query are required for sync collaboration mode' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await handleSyncCollaboration(supabase, genAI, mindop_id, target_mindop_id, query, user.id)
      
      case 'async_task':
        if (!task_id) {
          return new Response(
            JSON.stringify({ error: 'task_id is required for async task mode' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await handleAsyncTask(supabase, genAI, task_id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid mode. Use: local, sync_collaboration, or async_task' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }        )
    }
  } catch (error) {
    console.error('Unhandled error in mindop-service:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})