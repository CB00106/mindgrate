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

  try {    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { pathname } = new URL(req.url)
    
    if (pathname.endsWith('/search-analytics')) {
      return await getSearchAnalytics(req, supabaseClient)
    } else if (pathname.endsWith('/performance')) {
      return await getPerformanceStats(req, supabaseClient)
    } else if (pathname.endsWith('/usage-trends')) {
      return await getUsageTrends(req, supabaseClient)
    } else if (pathname.endsWith('/optimize')) {
      return await optimizeDatabase(req, supabaseClient)
    } else if (pathname.endsWith('/health-check')) {
      return await healthCheck(req, supabaseClient)
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Analytics service error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function getSearchAnalytics(req: Request, supabaseClient: any) {
  const url = new URL(req.url)
  const days = parseInt(url.searchParams.get('days') || '30')

  try {
    // Get search statistics view
    const { data: searchStats, error: statsError } = await supabaseClient
      .from('vectors.search_statistics')
      .select('*')
      .order('search_date', { ascending: false })
      .limit(days)

    if (statsError) {
      throw new Error(`Get search statistics error: ${statsError.message}`)
    }

    // Get top queries
    const { data: topQueries, error: queriesError } = await supabaseClient
      .from('vectors.search_sessions')
      .select('query, results_count, created_at')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('results_count', { ascending: false })
      .limit(10)

    if (queriesError) {
      throw new Error(`Get top queries error: ${queriesError.message}`)
    }

    // Get query patterns
    const queryPatterns = analyzeQueryPatterns(topQueries || [])

    return new Response(
      JSON.stringify({
        timeRange: { days },
        searchTrends: searchStats || [],
        topQueries: topQueries || [],
        queryPatterns,
        insights: generateSearchInsights(searchStats || [], topQueries || [])
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Get search analytics error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get search analytics', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getPerformanceStats(req: Request, supabaseClient: any) {
  try {
    // Get performance analysis
    const { data: performance, error: perfError } = await supabaseClient
      .rpc('vectors.analyze_performance')

    if (perfError) {
      throw new Error(`Get performance analysis error: ${perfError.message}`)
    }

    // Get index usage
    const { data: indexUsage, error: indexError } = await supabaseClient
      .rpc('vectors.get_index_usage')

    if (indexError) {
      throw new Error(`Get index usage error: ${indexError.message}`)
    }

    return new Response(
      JSON.stringify({
        tableStats: performance || [],
        indexUsage: indexUsage || [],
        recommendations: generatePerformanceRecommendations(performance || [], indexUsage || [])
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Get performance stats error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get performance stats', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getUsageTrends(req: Request, supabaseClient: any) {
  const url = new URL(req.url)
  const period = url.searchParams.get('period') || 'week' // week, month, quarter

  try {
    let dateFormat = 'day'
    let intervalDays = 7

    switch (period) {
      case 'month':
        dateFormat = 'day'
        intervalDays = 30
        break
      case 'quarter':
        dateFormat = 'week'
        intervalDays = 90
        break
      default:
        dateFormat = 'day'
        intervalDays = 7
    }

    const startDate = new Date(Date.now() - intervalDays * 24 * 60 * 60 * 1000).toISOString()

    // Document creation trends
    const { data: documentTrends, error: docError } = await supabaseClient
      .from('vectors.documents')
      .select('created_at')
      .gte('created_at', startDate)

    if (docError) {
      throw new Error(`Get document trends error: ${docError.message}`)
    }

    // Search trends
    const { data: searchTrends, error: searchError } = await supabaseClient
      .from('vectors.search_sessions')
      .select('created_at, results_count')
      .gte('created_at', startDate)

    if (searchError) {
      throw new Error(`Get search trends error: ${searchError.message}`)
    }

    const trends = aggregateTrendData(documentTrends || [], searchTrends || [], dateFormat)

    return new Response(
      JSON.stringify({
        period,
        dateFormat,
        trends,
        summary: {
          totalDocuments: documentTrends?.length || 0,
          totalSearches: searchTrends?.length || 0,
          avgSearchResults: searchTrends?.reduce((sum, s) => sum + (s.results_count || 0), 0) / (searchTrends?.length || 1)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Get usage trends error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get usage trends', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function optimizeDatabase(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Run optimization function
    const { data: result, error } = await supabaseClient
      .rpc('vectors.optimize_search_performance')

    if (error) {
      throw new Error(`Optimization error: ${error.message}`)
    }

    // Clean up old search sessions
    const { data: cleanupResult, error: cleanupError } = await supabaseClient
      .rpc('vectors.cleanup_old_searches', { days_to_keep: 30 })

    if (cleanupError) {
      console.warn('Cleanup warning:', cleanupError.message)
    }

    return new Response(
      JSON.stringify({
        message: result || 'Database optimization completed',
        cleanedUpSearches: cleanupResult || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Optimize database error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to optimize database', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function healthCheck(req: Request, supabaseClient: any) {
  try {
    // Check basic connectivity
    const { data: connectivityTest, error: connError } = await supabaseClient
      .from('vectors.documents')
      .select('count')
      .limit(1)

    if (connError) {
      throw new Error(`Connectivity test failed: ${connError.message}`)
    }

    // Check vector extension
    const { data: extensionTest, error: extError } = await supabaseClient
      .rpc('vectors.get_user_summary')

    if (extError) {
      throw new Error(`Vector extension test failed: ${extError.message}`)
    }

    // Check index health (simplified)
    const { data: indexTest, error: indexError } = await supabaseClient
      .rpc('vectors.get_index_usage')

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database_connectivity: !connError,
        vector_extension: !extError,
        indexes: !indexError,
      },
      details: {
        user_summary: extensionTest?.[0] || null,
        index_count: indexTest?.length || 0
      }
    }

    return new Response(
      JSON.stringify(health),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Health check error:', error)
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Helper functions
function calculateSearchSuccessRate(searches: any[]): number {
  if (searches.length === 0) return 0
  const successfulSearches = searches.filter(s => (s.results_count || 0) > 0).length
  return Math.round((successfulSearches / searches.length) * 100)
}

function calculateAvgResults(searches: any[]): number {
  if (searches.length === 0) return 0
  const totalResults = searches.reduce((sum, s) => sum + (s.results_count || 0), 0)
  return Math.round(totalResults / searches.length * 10) / 10
}

function countRecentDocuments(documents: any[]): number {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return documents.filter(d => new Date(d.created_at) > oneWeekAgo).length
}

function analyzeQueryPatterns(queries: any[]): any {
  const patterns = {
    avgQueryLength: 0,
    commonWords: [] as string[],
    queryTypes: {
      questions: 0,
      keywords: 0,
      phrases: 0
    }
  }

  if (queries.length === 0) return patterns

  // Calculate average query length
  const totalLength = queries.reduce((sum, q) => sum + q.query.length, 0)
  patterns.avgQueryLength = Math.round(totalLength / queries.length)

  // Analyze query types
  queries.forEach(q => {
    const query = q.query.toLowerCase()
    if (query.includes('?') || query.startsWith('what') || query.startsWith('how') || query.startsWith('why')) {
      patterns.queryTypes.questions++
    } else if (query.includes(' ') && query.split(' ').length > 2) {
      patterns.queryTypes.phrases++
    } else {
      patterns.queryTypes.keywords++
    }
  })

  return patterns
}

function generateSearchInsights(searchStats: any[], topQueries: any[]): string[] {
  const insights: string[] = []

  if (searchStats.length > 0) {
    const avgSearches = searchStats.reduce((sum, s) => sum + s.total_searches, 0) / searchStats.length
    if (avgSearches > 10) {
      insights.push("High search activity detected - consider adding more relevant content")
    }
  }

  if (topQueries.length > 0) {
    const lowResultQueries = topQueries.filter(q => q.results_count < 3).length
    if (lowResultQueries > topQueries.length * 0.3) {
      insights.push("Many queries return few results - consider improving content coverage")
    }
  }

  if (insights.length === 0) {
    insights.push("Vector database is performing well")
  }

  return insights
}

function generatePerformanceRecommendations(performance: any[], indexUsage: any[]): string[] {
  const recommendations: string[] = []

  // Add basic recommendations based on table sizes and index usage
  if (performance.some(p => p.total_rows > 10000)) {
    recommendations.push("Consider partitioning large tables for better performance")
  }

  if (indexUsage.some(i => i.index_scans === 0)) {
    recommendations.push("Some indexes are not being used - consider removing unused indexes")
  }

  if (recommendations.length === 0) {
    recommendations.push("Database performance is optimal")
  }

  return recommendations
}

function aggregateTrendData(documents: any[], searches: any[], dateFormat: string): any {
  const trends: { [key: string]: any } = {}

  // Aggregate document creation
  documents.forEach(doc => {
    const date = formatDate(doc.created_at, dateFormat)
    if (!trends[date]) {
      trends[date] = { documents: 0, searches: 0, searchResults: 0 }
    }
    trends[date].documents++
  })

  // Aggregate searches
  searches.forEach(search => {
    const date = formatDate(search.created_at, dateFormat)
    if (!trends[date]) {
      trends[date] = { documents: 0, searches: 0, searchResults: 0 }
    }
    trends[date].searches++
    trends[date].searchResults += search.results_count || 0
  })

  return Object.entries(trends)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function formatDate(dateStr: string, format: string): string {
  const date = new Date(dateStr)
  
  if (format === 'week') {
    // Get start of week
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    return startOfWeek.toISOString().split('T')[0]
  }
  
  return date.toISOString().split('T')[0] // day format
}
