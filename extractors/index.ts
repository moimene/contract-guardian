/**
 * Unified Document Extractor
 * 
 * Single entry point for extracting clauses from any supported document type.
 * Automatically detects file type and routes to appropriate extractor.
 */

import { extractClausesFromDocx, ExtractedClause as DocxClause, ExtractionResult as DocxResult } from './docx_clause_extractor';
import { extractClausesFromPdf, PDFExtractedClause, PDFExtractionResult } from './pdf_clause_extractor';
import { generateRedlineDocx, generateStructuredRedline, convertPdfToRedlinedDocx, RedlineChange, GeneratedRedline } from './docx_redline_generator';

// ============================================================
// Unified Types
// ============================================================

export interface UnifiedClause {
    clause_id: string;
    sequence_number: number;
    heading: string | null;
    clause_text: string;
    offsets: {
        start: number;
        end: number;
        page_numbers?: number[];
        paragraph_ids?: string[];
    };
    source_type: 'docx' | 'pdf';
}

export interface UnifiedExtractionResult {
    document_text: string;
    clauses: UnifiedClause[];
    source_type: 'docx' | 'pdf';
    metadata: {
        total_pages?: number;
        total_paragraphs?: number;
        total_characters: number;
        extraction_method: string;
        pdf_info?: {
            title?: string;
            author?: string;
        };
    };
}

// ============================================================
// File Type Detection
// ============================================================

/**
 * Detect file type from buffer magic bytes
 */
export function detectFileType(buffer: Buffer): 'docx' | 'pdf' | 'unknown' {
    // Check PDF (starts with %PDF-)
    if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') {
        return 'pdf';
    }

    // Check ZIP/DOCX (starts with PK)
    if (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
        return 'docx';
    }

    return 'unknown';
}

/**
 * Detect file type from filename extension
 */
export function detectFileTypeFromName(filename: string): 'docx' | 'pdf' | 'unknown' {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.docx')) return 'docx';
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.endsWith('.doc')) return 'docx'; // Will try to handle
    return 'unknown';
}

// ============================================================
// Unified Extractor
// ============================================================

/**
 * Extract clauses from any supported document
 */
export async function extractClauses(
    buffer: Buffer,
    options: {
        filename?: string;
        minClauseLength?: number;
        maxClauseLength?: number;
    } = {}
): Promise<UnifiedExtractionResult> {
    // Detect file type
    let fileType = detectFileType(buffer);

    // Fallback to filename if buffer detection fails
    if (fileType === 'unknown' && options.filename) {
        fileType = detectFileTypeFromName(options.filename);
    }

    if (fileType === 'unknown') {
        throw new Error('Unsupported file format. Only DOCX and PDF are supported.');
    }

    const extractionOptions = {
        minClauseLength: options.minClauseLength || 50,
        maxClauseLength: options.maxClauseLength || 10000,
    };

    if (fileType === 'docx') {
        const result = await extractClausesFromDocx(buffer, extractionOptions);
        return convertDocxResult(result);
    } else {
        const result = await extractClausesFromPdf(buffer, extractionOptions);
        return convertPdfResult(result);
    }
}

/**
 * Convert DOCX extraction result to unified format
 */
function convertDocxResult(result: DocxResult): UnifiedExtractionResult {
    return {
        document_text: result.document_text,
        source_type: 'docx',
        clauses: result.clauses.map(c => ({
            clause_id: c.clause_id,
            sequence_number: c.sequence_number,
            heading: c.heading,
            clause_text: c.clause_text,
            offsets: {
                start: c.offsets.start,
                end: c.offsets.end,
                paragraph_ids: c.offsets.paragraph_ids,
            },
            source_type: 'docx' as const,
        })),
        metadata: {
            total_paragraphs: result.metadata.total_paragraphs,
            total_characters: result.metadata.total_characters,
            extraction_method: result.metadata.extraction_method,
        },
    };
}

/**
 * Convert PDF extraction result to unified format
 */
function convertPdfResult(result: PDFExtractionResult): UnifiedExtractionResult {
    return {
        document_text: result.document_text,
        source_type: 'pdf',
        clauses: result.clauses.map(c => ({
            clause_id: c.clause_id,
            sequence_number: c.sequence_number,
            heading: c.heading,
            clause_text: c.clause_text,
            offsets: {
                start: c.offsets.start,
                end: c.offsets.end,
                page_numbers: c.offsets.page_numbers,
            },
            source_type: 'pdf' as const,
        })),
        metadata: {
            total_pages: result.metadata.total_pages,
            total_characters: result.metadata.total_characters,
            extraction_method: result.metadata.extraction_method,
            pdf_info: result.metadata.pdf_info,
        },
    };
}

// ============================================================
// Unified Redline Generation
// ============================================================

/**
 * Generate redlined DOCX from extraction result and changes
 */
export async function generateRedline(
    extractionResult: UnifiedExtractionResult,
    changes: RedlineChange[],
    config: {
        document_id: string;
        author_name?: string;
        include_comments?: boolean;
    }
): Promise<GeneratedRedline> {
    const clauses = extractionResult.clauses.map(c => ({
        clause_id: c.clause_id,
        heading: c.heading,
        clause_text: c.clause_text,
    }));

    return generateStructuredRedline({
        document_id: config.document_id,
        original_text: extractionResult.document_text,
        clauses,
        changes,
        config: {
            author_name: config.author_name || 'Amazon Legal Review',
            include_comments: config.include_comments ?? true,
        },
    });
}

// ============================================================
// Re-exports for convenience
// ============================================================

export {
    extractClausesFromDocx,
    extractClausesFromPdf,
    generateRedlineDocx,
    generateStructuredRedline,
    convertPdfToRedlinedDocx,
};

export type {
    DocxClause,
    DocxResult,
    PDFExtractedClause,
    PDFExtractionResult,
    RedlineChange,
    GeneratedRedline,
};

// ============================================================
// Aspose Compare-Based Redlining (Production)
// ============================================================

export {
    AsposeWordsClient,
    AnchorResolver,
    RedlineBuilder,
    createRedlineBuilder,
} from './aspose_redline_builder';

export type {
    AsposeConfig,
    CompareRequest,
    CompareResult,
    RedlineRequest,
    RedlineResult,
    DocumentIR,
    ParagraphIR,
    RunIR,
    ResolvedAnchor,
} from './aspose_redline_builder';
