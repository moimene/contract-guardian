/**
 * PDF Clause Extractor
 * 
 * Extracts clauses from PDF documents with:
 * - Text extraction with position tracking
 * - Page and line number mapping
 * - Clause boundary detection
 */

import * as pdfParse from 'pdf-parse';

// ============================================================
// Types
// ============================================================

export interface PDFClauseOffsets {
    start: number;
    end: number;
    page_numbers: number[];
    line_start?: number;
    line_end?: number;
}

export interface PDFExtractedClause {
    clause_id: string;
    sequence_number: number;
    heading: string | null;
    clause_text: string;
    offsets: PDFClauseOffsets;
}

export interface PDFExtractionResult {
    document_text: string;
    clauses: PDFExtractedClause[];
    metadata: {
        total_pages: number;
        total_characters: number;
        extraction_method: string;
        pdf_info?: {
            title?: string;
            author?: string;
            creation_date?: string;
        };
    };
}

// ============================================================
// Clause Detection Patterns (same as DOCX)
// ============================================================

const HEADING_PATTERNS = [
    /^(?:Article|Section|Clause)\s+\d+/i,
    /^\d+\.\s+[A-Z]/,
    /^\d+\.\d+\s+[A-Z]/,
    /^[IVXLC]+\.\s+[A-Z]/i,
    /^\([a-z]\)\s+/i,
    /^[A-Z]{2,}[\s:]/,
];

// ============================================================
// Core Extraction Functions
// ============================================================

/**
 * Check if a line is a heading
 */
function isHeadingLine(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed.length < 3 || trimmed.length > 200) return false;

    // Check patterns
    if (HEADING_PATTERNS.some(p => p.test(trimmed))) {
        return true;
    }

    // Check if ALL CAPS and short
    if (trimmed.length < 100 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
        return true;
    }

    // Check if ends with colon
    if (trimmed.length < 100 && trimmed.endsWith(':')) {
        return true;
    }

    return false;
}

/**
 * Generate clause ID from heading or sequence
 */
function generateClauseId(heading: string | null, sequence: number): string {
    if (heading) {
        const match = heading.match(/^(?:Article|Section|Clause)?\s*(\d+(?:\.\d+)*)/i);
        if (match) {
            return `clause_${match[1].replace(/\./g, '_')}`;
        }

        const sanitized = heading
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .substring(0, 30);
        return `clause_${sanitized}`;
    }

    return `clause_${sequence}`;
}

/**
 * Parse page breaks from raw PDF text
 */
function parseWithPageInfo(text: string): Array<{ page: number; text: string; offset: number }> {
    // pdf-parse typically includes form feed characters or page markers
    const pages: Array<{ page: number; text: string; offset: number }> = [];

    // Try to split by form feed character (common in PDF parsing)
    const parts = text.split(/\f/);
    let offset = 0;

    parts.forEach((part, index) => {
        pages.push({
            page: index + 1,
            text: part,
            offset,
        });
        offset += part.length + 1; // +1 for the form feed
    });

    return pages;
}

/**
 * Group lines into clauses
 */
function groupLinesIntoClauses(
    lines: string[],
    documentText: string
): PDFExtractedClause[] {
    const clauses: PDFExtractedClause[] = [];
    let currentClause: {
        heading: string | null;
        lines: string[];
        startOffset: number;
    } | null = null;

    let sequence = 0;
    let currentOffset = 0;

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines but track offset
        if (!trimmed) {
            currentOffset += line.length + 1; // +1 for newline
            continue;
        }

        if (isHeadingLine(trimmed)) {
            // Save previous clause if exists
            if (currentClause && currentClause.lines.length > 0) {
                sequence++;
                const clauseText = currentClause.lines.join('\n');
                const endOffset = currentOffset;

                clauses.push({
                    clause_id: generateClauseId(currentClause.heading, sequence),
                    sequence_number: sequence,
                    heading: currentClause.heading,
                    clause_text: clauseText,
                    offsets: {
                        start: currentClause.startOffset,
                        end: endOffset,
                        page_numbers: [], // Will be filled in post-processing
                    },
                });
            }

            // Start new clause
            currentClause = {
                heading: trimmed,
                lines: [line],
                startOffset: currentOffset,
            };
        } else {
            // Add to current clause or start new one
            if (!currentClause) {
                currentClause = {
                    heading: null,
                    lines: [],
                    startOffset: currentOffset,
                };
            }
            currentClause.lines.push(line);
        }

        currentOffset += line.length + 1; // +1 for newline
    }

    // Don't forget last clause
    if (currentClause && currentClause.lines.length > 0) {
        sequence++;
        const clauseText = currentClause.lines.join('\n');

        clauses.push({
            clause_id: generateClauseId(currentClause.heading, sequence),
            sequence_number: sequence,
            heading: currentClause.heading,
            clause_text: clauseText,
            offsets: {
                start: currentClause.startOffset,
                end: currentOffset,
                page_numbers: [],
            },
        });
    }

    return clauses;
}

/**
 * Assign page numbers to clauses based on offsets
 */
function assignPageNumbers(
    clauses: PDFExtractedClause[],
    pages: Array<{ page: number; text: string; offset: number }>
): void {
    for (const clause of clauses) {
        const pageNumbers: number[] = [];

        for (const page of pages) {
            const pageStart = page.offset;
            const pageEnd = pageStart + page.text.length;

            // Check if clause overlaps with this page
            if (clause.offsets.start < pageEnd && clause.offsets.end > pageStart) {
                pageNumbers.push(page.page);
            }
        }

        clause.offsets.page_numbers = pageNumbers;
    }
}

// ============================================================
// Main Export Function
// ============================================================

/**
 * Extract clauses from a PDF buffer
 */
export async function extractClausesFromPdf(
    pdfBuffer: Buffer,
    options: {
        minClauseLength?: number;
        maxClauseLength?: number;
    } = {}
): Promise<PDFExtractionResult> {
    const {
        minClauseLength = 50,
        maxClauseLength = 10000,
    } = options;

    // Parse PDF
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    // Parse page information
    const pages = parseWithPageInfo(text);

    // Split into lines
    const lines = text.split('\n');

    // Group into clauses
    let clauses = groupLinesIntoClauses(lines, text);

    // Assign page numbers
    assignPageNumbers(clauses, pages);

    // Filter by length
    clauses = clauses.filter(c => {
        const len = c.clause_text.length;
        return len >= minClauseLength && len <= maxClauseLength;
    });

    // Re-sequence after filtering
    clauses = clauses.map((c, i) => ({
        ...c,
        sequence_number: i + 1,
    }));

    return {
        document_text: text,
        clauses,
        metadata: {
            total_pages: pdfData.numpages,
            total_characters: text.length,
            extraction_method: 'pdf_parse_heading_detection',
            pdf_info: {
                title: pdfData.info?.Title,
                author: pdfData.info?.Author,
                creation_date: pdfData.info?.CreationDate,
            },
        },
    };
}

/**
 * Prepare clause text for embedding (same interface as DOCX)
 */
export function prepareForEmbedding(clause: PDFExtractedClause): string {
    const prefix = clause.heading ? `[${clause.heading}] ` : '';
    return prefix + clause.clause_text;
}
