/**
 * Embedding Generator
 * 
 * Generates vector embeddings for clauses and variation examples
 * using OpenAI's text-embedding-3-small model.
 */

import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================
// Types
// ============================================================

export interface EmbeddingInput {
    source_id: string;
    source_type: 'clause' | 'variation_example' | 'standard_position';
    doc_type: 'standard' | 'acceptable' | 'unacceptable' | 'example' | 'clause';
    text: string;
    rule_id?: string;
}

export interface EmbeddingRecord {
    embedding_id?: string;
    tenant_id: string;
    playbook_id: string;
    playbook_version: string;
    rule_id: string | null;
    doc_type: string;
    source_id: string;
    source_type: string;
    embedding: number[];
    text_hash: string;
    chunk_index: number;
}

export interface EmbeddingResult {
    success: boolean;
    embedding_id?: string;
    error?: string;
}

// ============================================================
// Configuration
// ============================================================

const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small';
const EMBED_DIM = parseInt(process.env.EMBED_DIM || '1536', 10);
const BATCH_SIZE = 100; // OpenAI max batch size
const MAX_TOKENS_PER_TEXT = 8000; // Approximate token limit

// ============================================================
// Utilities
// ============================================================

/**
 * Calculate MD5 hash of text
 */
function hashText(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Truncate text to approximate token limit
 */
function truncateToTokenLimit(text: string, maxTokens: number = MAX_TOKENS_PER_TEXT): string {
    // Rough approximation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + '...';
}

// ============================================================
// OpenAI Embedding Client
// ============================================================

export class EmbeddingGenerator {
    private openai: OpenAI;
    private supabase: SupabaseClient;
    private config: {
        tenant_id: string;
        playbook_id: string;
        playbook_version: string;
    };

    constructor(
        openaiApiKey: string,
        supabaseUrl: string,
        supabaseKey: string,
        config: {
            tenant_id: string;
            playbook_id: string;
            playbook_version: string;
        }
    ) {
        this.openai = new OpenAI({ apiKey: openaiApiKey });
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.config = config;
    }

    /**
     * Generate embedding for a single text
     */
    async embedText(text: string): Promise<number[]> {
        const truncated = truncateToTokenLimit(text);

        const response = await this.openai.embeddings.create({
            model: EMBED_MODEL,
            input: truncated,
            dimensions: EMBED_DIM,
        });

        return response.data[0].embedding;
    }

    /**
     * Generate embeddings for multiple texts in batch
     */
    async embedBatch(texts: string[]): Promise<number[][]> {
        const truncated = texts.map(t => truncateToTokenLimit(t));

        // Split into batches
        const batches: string[][] = [];
        for (let i = 0; i < truncated.length; i += BATCH_SIZE) {
            batches.push(truncated.slice(i, i + BATCH_SIZE));
        }

        const allEmbeddings: number[][] = [];

        for (const batch of batches) {
            const response = await this.openai.embeddings.create({
                model: EMBED_MODEL,
                input: batch,
                dimensions: EMBED_DIM,
            });

            const embeddings = response.data
                .sort((a, b) => a.index - b.index)
                .map(d => d.embedding);

            allEmbeddings.push(...embeddings);
        }

        return allEmbeddings;
    }

    /**
     * Store embedding in Supabase
     */
    async storeEmbedding(input: EmbeddingInput, embedding: number[], chunkIndex: number = 0): Promise<EmbeddingResult> {
        const record: EmbeddingRecord = {
            tenant_id: this.config.tenant_id,
            playbook_id: this.config.playbook_id,
            playbook_version: this.config.playbook_version,
            rule_id: input.rule_id || null,
            doc_type: input.doc_type,
            source_id: input.source_id,
            source_type: input.source_type,
            embedding,
            text_hash: hashText(input.text),
            chunk_index: chunkIndex,
        };

        const { data, error } = await this.supabase
            .from('amazon_redliner.embeddings')
            .insert(record)
            .select('embedding_id')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, embedding_id: data?.embedding_id };
    }

    /**
     * Generate and store embedding for a single input
     */
    async processOne(input: EmbeddingInput): Promise<EmbeddingResult> {
        try {
            const embedding = await this.embedText(input.text);
            return await this.storeEmbedding(input, embedding);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Process multiple inputs in parallel batches
     */
    async processMany(
        inputs: EmbeddingInput[],
        concurrency: number = 5
    ): Promise<{ successful: number; failed: number; errors: string[] }> {
        const results = {
            successful: 0,
            failed: 0,
            errors: [] as string[],
        };

        // Generate all embeddings first (batched)
        const texts = inputs.map(i => i.text);
        let embeddings: number[][];

        try {
            embeddings = await this.embedBatch(texts);
        } catch (error) {
            return {
                successful: 0,
                failed: inputs.length,
                errors: [error instanceof Error ? error.message : 'Batch embedding failed'],
            };
        }

        // Store in parallel with concurrency limit
        const chunks: EmbeddingInput[][] = [];
        for (let i = 0; i < inputs.length; i += concurrency) {
            chunks.push(inputs.slice(i, i + concurrency));
        }

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const startIdx = chunkIndex * concurrency;

            const promises = chunk.map((input, i) =>
                this.storeEmbedding(input, embeddings[startIdx + i])
            );

            const chunkResults = await Promise.all(promises);

            for (const result of chunkResults) {
                if (result.success) {
                    results.successful++;
                } else {
                    results.failed++;
                    if (result.error) results.errors.push(result.error);
                }
            }
        }

        return results;
    }

    /**
     * Check if embedding already exists (by text hash)
     */
    async exists(text: string, source_type: string, rule_id?: string): Promise<boolean> {
        const textHash = hashText(text);

        const query = this.supabase
            .from('amazon_redliner.embeddings')
            .select('embedding_id')
            .eq('text_hash', textHash)
            .eq('source_type', source_type)
            .eq('tenant_id', this.config.tenant_id)
            .eq('playbook_id', this.config.playbook_id);

        if (rule_id) {
            query.eq('rule_id', rule_id);
        }

        const { data } = await query.limit(1);
        return data !== null && data.length > 0;
    }

    /**
     * Search for similar embeddings
     */
    async searchSimilar(
        queryText: string,
        options: {
            rule_id?: string;
            doc_type?: string;
            top_k?: number;
        } = {}
    ): Promise<Array<{ source_id: string; source_type: string; similarity: number }>> {
        const { rule_id = null, doc_type = null, top_k = 5 } = options;

        const queryEmbedding = await this.embedText(queryText);

        const { data, error } = await this.supabase.rpc('amazon_redliner.search_embeddings', {
            query_embedding: queryEmbedding,
            p_tenant_id: this.config.tenant_id,
            p_playbook_id: this.config.playbook_id,
            p_rule_id: rule_id,
            p_doc_type: doc_type,
            p_top_k: top_k,
        });

        if (error) throw error;
        return data || [];
    }
}

// ============================================================
// Helper: Embed Clauses from Extraction Result
// ============================================================

import { ExtractedClause, prepareForEmbedding, chunkClause } from './docx_clause_extractor';

/**
 * Generate embeddings for all extracted clauses
 */
export async function embedExtractedClauses(
    generator: EmbeddingGenerator,
    clauses: ExtractedClause[],
    documentId: string,
    options: {
        chunkLongClauses?: boolean;
        maxChunkSize?: number;
    } = {}
): Promise<{ successful: number; failed: number }> {
    const { chunkLongClauses = true, maxChunkSize = 1500 } = options;

    const inputs: EmbeddingInput[] = [];

    for (const clause of clauses) {
        if (chunkLongClauses && clause.clause_text.length > maxChunkSize) {
            // Chunk long clauses
            const chunks = chunkClause(clause, maxChunkSize);
            chunks.forEach((chunk, idx) => {
                inputs.push({
                    source_id: `${documentId}:${clause.clause_id}:${idx}`,
                    source_type: 'clause',
                    doc_type: 'clause',
                    text: chunk,
                });
            });
        } else {
            inputs.push({
                source_id: `${documentId}:${clause.clause_id}`,
                source_type: 'clause',
                doc_type: 'clause',
                text: prepareForEmbedding(clause),
            });
        }
    }

    const result = await generator.processMany(inputs);
    return { successful: result.successful, failed: result.failed };
}
