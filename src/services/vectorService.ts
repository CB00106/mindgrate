import { supabase } from './supabaseClient'

export interface VectorSearchRequest {
  query: string
  threshold?: number
  limit?: number
  collectionIds?: string[]
  documentIds?: string[]
}

export interface VectorSearchResult {
  id: string
  document_id: string
  content: string
  similarity: number
  document_title: string
  document_metadata: Record<string, any>
  chunk_metadata: Record<string, any>
}

export interface DocumentUploadRequest {
  title: string
  content: string
  contentType?: string
  sourceUrl?: string
  metadata?: Record<string, any>
  chunkSize?: number
}

export interface VectorDocument {
  id: string
  title: string
  content: string
  content_type: string
  source_url?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  created_by: string
  embeddings?: { count: number }[]
  collections?: Array<{
    collection: {
      id: string
      name: string
      description?: string
    }
  }>
}

export interface EmbeddingResponse {
  embedding: number[]
  text: string
  model: string
  dimensions: number
}

class VectorService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
      ...options.headers,
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Document operations
  async uploadDocument(document: DocumentUploadRequest): Promise<{ document: VectorDocument; chunksCreated: number; message: string }> {
    return this.makeRequest('/vector-service/documents', {
      method: 'POST',
      body: JSON.stringify(document),
    })
  }

  async getDocuments(): Promise<{ documents: VectorDocument[] }> {
    return this.makeRequest('/vector-service/documents', {
      method: 'GET',
    })
  }

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    return this.makeRequest(`/vector-service/documents/${documentId}`, {
      method: 'DELETE',
    })
  }

  // Embedding operations
  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResponse> {
    return this.makeRequest('/vector-service/embed', {
      method: 'POST',
      body: JSON.stringify({ text, model }),
    })
  }

  // Search operations
  async similaritySearch(request: VectorSearchRequest): Promise<{
    query: string
    results: VectorSearchResult[]
    totalResults: number
    threshold: number
    limit: number
  }> {
    return this.makeRequest('/vector-service/search', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async documentSimilaritySearch(request: VectorSearchRequest): Promise<{
    query: string
    results: Array<{
      document_id: string
      title: string
      content: string
      avg_similarity: number
      max_similarity: number
      chunk_count: number
      metadata: Record<string, any>
    }>
    totalResults: number
  }> {
    return this.makeRequest('/vector-service/document-search', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Batch operations
  async batchUploadDocuments(documents: DocumentUploadRequest[]): Promise<{
    successful: number
    failed: number
    results: Array<{ success: boolean; document?: VectorDocument; error?: string }>
  }> {
    const results = await Promise.allSettled(
      documents.map(doc => this.uploadDocument(doc))
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return {
      successful,
      failed,
      results: results.map(result => ({
        success: result.status === 'fulfilled',
        document: result.status === 'fulfilled' ? result.value.document : undefined,
        error: result.status === 'rejected' ? result.reason.message : undefined,
      })),
    }
  }

  // Utility methods
  async getDocumentStats(documentId: string): Promise<{
    document_id: string
    title: string
    chunk_count: number
    total_content_length: number
    created_at: string
    updated_at: string
  }> {
    const { data, error } = await supabase
      .rpc('vectors.get_document_stats', { doc_id: documentId })

    if (error) {
      throw new Error(`Failed to get document stats: ${error.message}`)
    }

    return data[0]
  }

  async getUserSummary(): Promise<{
    total_documents: number
    total_embeddings: number
    total_collections: number
    avg_chunks_per_document: number
    latest_document_date: string
  }> {
    const { data, error } = await supabase
      .rpc('vectors.get_user_summary')

    if (error) {
      throw new Error(`Failed to get user summary: ${error.message}`)
    }

    return data[0]
  }

  // Search with filters
  async searchInCollections(query: string, collectionIds: string[], options?: {
    threshold?: number
    limit?: number
  }): Promise<VectorSearchResult[]> {
    const result = await this.similaritySearch({
      query,
      collectionIds,
      threshold: options?.threshold,
      limit: options?.limit,
    })

    return result.results
  }

  async searchInDocuments(query: string, documentIds: string[], options?: {
    threshold?: number
    limit?: number
  }): Promise<VectorSearchResult[]> {
    const result = await this.similaritySearch({
      query,
      documentIds,
      threshold: options?.threshold,
      limit: options?.limit,
    })

    return result.results
  }

  // Smart search with auto-categorization
  async smartSearch(query: string, options?: {
    autoSelectCollections?: boolean
    threshold?: number
    limit?: number
  }): Promise<{
    results: VectorSearchResult[]
    suggestions: string[]
    categories: string[]
  }> {
    // First, perform a broad search
    const searchResult = await this.similaritySearch({
      query,
      threshold: options?.threshold || 0.7,
      limit: options?.limit || 20,
    })

    // Extract categories from results
    const categories = this.extractCategories(searchResult.results)
    
    // Generate search suggestions
    const suggestions = this.generateSearchSuggestions(query, searchResult.results)

    return {
      results: searchResult.results,
      suggestions,
      categories,
    }
  }

  private extractCategories(results: VectorSearchResult[]): string[] {
    const categories = new Set<string>()
    
    results.forEach(result => {
      if (result.document_metadata?.category) {
        categories.add(result.document_metadata.category)
      }
      if (result.document_metadata?.tags) {
        result.document_metadata.tags.forEach((tag: string) => categories.add(tag))
      }
    })

    return Array.from(categories)
  }

  private generateSearchSuggestions(query: string, results: VectorSearchResult[]): string[] {
    const suggestions: string[] = []
    
    // Extract common terms from high-similarity results
    const highSimilarityResults = results.filter(r => r.similarity > 0.85)
    
    if (highSimilarityResults.length > 0) {
      // Simple suggestion generation based on content
      const commonTerms = this.extractCommonTerms(highSimilarityResults.map(r => r.content))
      suggestions.push(...commonTerms.slice(0, 3).map(term => `${query} ${term}`))
    }

    // Add category-based suggestions
    const categories = this.extractCategories(results)
    if (categories.length > 0) {
      suggestions.push(...categories.slice(0, 2).map(cat => `${query} in ${cat}`))
    }

    return suggestions.filter((suggestion, index, self) => self.indexOf(suggestion) === index)
  }

  private extractCommonTerms(texts: string[]): string[] {
    const wordCount: { [key: string]: number } = {}
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
    
    texts.forEach(text => {
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word))
      
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })
    })

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }
}

export const vectorService = new VectorService()
export default vectorService
