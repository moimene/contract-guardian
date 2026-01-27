/**
 * DOCX Clause Extractor
 * 
 * Extracts clauses from Word documents with:
 * - Character offsets for precise anchoring
 * - Paragraph IDs for OOXML manipulation
 * - Heading detection for clause boundaries
 * - Section numbering pattern recognition
 */

import * as mammoth from 'mammoth';
import * as JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

// ============================================================
// Types
// ============================================================

export interface ClauseOffsets {
    start: number;
    end: number;
    paragraph_ids: string[];
}

export interface ExtractedClause {
    clause_id: string;
    sequence_number: number;
    heading: string | null;
    clause_text: string;
    offsets: ClauseOffsets;
    raw_xml?: string;
}

export interface ExtractionResult {
    document_text: string;
    clauses: ExtractedClause[];
    metadata: {
        total_paragraphs: number;
        total_characters: number;
        extraction_method: string;
    };
}

export interface ParagraphInfo {
    id: string;
    text: string;
    style: string | null;
    numbering: string | null;
    start_offset: number;
    end_offset: number;
}

// ============================================================
// Clause Detection Patterns
// ============================================================

// Common legal clause heading patterns
const HEADING_PATTERNS = [
    /^(?:Article|Section|Clause)\s+\d+/i,
    /^\d+\.\s+[A-Z]/,                          // 1. Heading
    /^\d+\.\d+\s+[A-Z]/,                       // 1.1 Subheading
    /^[IVXLC]+\.\s+[A-Z]/i,                    // I. Roman numeral
    /^\([a-z]\)\s+/i,                          // (a) Lettered
    /^[A-Z]{2,}[\s:]/,                         // ALL CAPS heading
];

// Patterns indicating clause family
const FAMILY_INDICATORS: Record<string, RegExp[]> = {
    PaymentCredits: [/payment/i, /revenue/i, /invoice/i, /net revenues/i],
    ThirdPartyCredits: [/credit/i, /screen credit/i, /billing/i, /paid advertising/i],
    RepsProdCo: [/represents?\s+and\s+warrants?/i, /production company/i, /licensor/i],
    RepsAmazon: [/amazon\s+represents/i, /distributor\s+represents/i],
    RepsTruthTerm: [/truth/i, /termination/i, /survival/i],
    IndemnityProdCo: [/indemnif/i, /licensor.*indemnif/i, /production.*indemnif/i],
    IndemnityAmazon: [/amazon.*indemnif/i, /distributor.*indemnif/i],
    DefenseSettlement: [/defense/i, /settlement/i, /control.*litigation/i],
    SurvivalRemedies: [/surviv/i, /remed/i, /injunctive/i, /cumulative/i],
};

// ============================================================
// Core Extraction Functions
// ============================================================

/**
 * Check if a paragraph is a heading
 */
function isHeading(para: ParagraphInfo): boolean {
    // Check style
    if (para.style && /heading|title/i.test(para.style)) {
        return true;
    }

    // Check numbering
    if (para.numbering) {
        return true;
    }

    // Check text patterns
    const text = para.text.trim();
    if (text.length < 200 && HEADING_PATTERNS.some(p => p.test(text))) {
        return true;
    }

    // Check if short and ends with colon
    if (text.length < 100 && text.endsWith(':')) {
        return true;
    }

    return false;
}

/**
 * Detect potential clause family from text
 */
function detectFamily(text: string): string | null {
    for (const [family, patterns] of Object.entries(FAMILY_INDICATORS)) {
        if (patterns.some(p => p.test(text))) {
            return family;
        }
    }
    return null;
}

/**
 * Generate clause ID from heading or sequence
 */
function generateClauseId(heading: string | null, sequence: number): string {
    if (heading) {
        // Extract numbering from heading
        const match = heading.match(/^(?:Article|Section|Clause)?\s*(\d+(?:\.\d+)*)/i);
        if (match) {
            return `clause_${match[1].replace(/\./g, '_')}`;
        }

        // Use sanitized heading
        const sanitized = heading
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .substring(0, 30);
        return `clause_${sanitized}`;
    }

    return `clause_${sequence}`;
}

/**
 * Parse DOCX and extract paragraph info with offsets
 */
async function extractParagraphs(docxBuffer: Buffer): Promise<ParagraphInfo[]> {
    const zip = await JSZip.loadAsync(docxBuffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');

    if (!documentXml) {
        throw new Error('Invalid DOCX: missing document.xml');
    }

    const doc = await parseStringPromise(documentXml, { explicitArray: false });
    const body = doc['w:document']['w:body'];

    const paragraphs: ParagraphInfo[] = [];
    let currentOffset = 0;
    let paraIndex = 0;

    // Handle both single paragraph and array of paragraphs
    const paraElements = Array.isArray(body['w:p']) ? body['w:p'] : [body['w:p']];

    for (const para of paraElements) {
        if (!para) continue;

        const paraId = para.$?.['w14:paraId'] || para.$?.['w:rsidR'] || `p_${paraIndex}`;

        // Extract style
        let style: string | null = null;
        if (para['w:pPr']?.['w:pStyle']) {
            style = para['w:pPr']['w:pStyle'].$?.['w:val'] || null;
        }

        // Extract numbering
        let numbering: string | null = null;
        if (para['w:pPr']?.['w:numPr']) {
            const numPr = para['w:pPr']['w:numPr'];
            const numId = numPr['w:numId']?.$?.['w:val'];
            const ilvl = numPr['w:ilvl']?.$?.['w:val'];
            if (numId) {
                numbering = `${numId}:${ilvl || 0}`;
            }
        }

        // Extract text from runs
        let text = '';
        const runs = para['w:r'];
        if (runs) {
            const runArray = Array.isArray(runs) ? runs : [runs];
            for (const run of runArray) {
                if (run['w:t']) {
                    const tElement = run['w:t'];
                    text += typeof tElement === 'string' ? tElement : (tElement._ || tElement);
                }
            }
        }

        // Also check direct text content
        if (para['w:t']) {
            const tElement = para['w:t'];
            text += typeof tElement === 'string' ? tElement : (tElement._ || tElement);
        }

        const startOffset = currentOffset;
        const endOffset = currentOffset + text.length;

        paragraphs.push({
            id: paraId,
            text,
            style,
            numbering,
            start_offset: startOffset,
            end_offset: endOffset,
        });

        currentOffset = endOffset + 1; // +1 for newline between paragraphs
        paraIndex++;
    }

    return paragraphs;
}

/**
 * Group paragraphs into clauses
 */
function groupIntoClauses(paragraphs: ParagraphInfo[]): ExtractedClause[] {
    const clauses: ExtractedClause[] = [];
    let currentClause: {
        heading: string | null;
        paragraphs: ParagraphInfo[];
    } | null = null;

    let sequence = 0;

    for (const para of paragraphs) {
        const trimmedText = para.text.trim();

        // Skip empty paragraphs
        if (!trimmedText) continue;

        if (isHeading(para)) {
            // Save previous clause if exists
            if (currentClause && currentClause.paragraphs.length > 0) {
                sequence++;
                clauses.push(buildClause(currentClause, sequence));
            }

            // Start new clause
            currentClause = {
                heading: trimmedText,
                paragraphs: [para],
            };
        } else {
            // Add to current clause or start new one
            if (!currentClause) {
                currentClause = {
                    heading: null,
                    paragraphs: [],
                };
            }
            currentClause.paragraphs.push(para);
        }
    }

    // Don't forget last clause
    if (currentClause && currentClause.paragraphs.length > 0) {
        sequence++;
        clauses.push(buildClause(currentClause, sequence));
    }

    return clauses;
}

/**
 * Build clause object from grouped paragraphs
 */
function buildClause(
    group: { heading: string | null; paragraphs: ParagraphInfo[] },
    sequence: number
): ExtractedClause {
    const paragraphs = group.paragraphs;
    const text = paragraphs.map(p => p.text).join('\n');

    const firstPara = paragraphs[0];
    const lastPara = paragraphs[paragraphs.length - 1];

    return {
        clause_id: generateClauseId(group.heading, sequence),
        sequence_number: sequence,
        heading: group.heading,
        clause_text: text,
        offsets: {
            start: firstPara.start_offset,
            end: lastPara.end_offset,
            paragraph_ids: paragraphs.map(p => p.id),
        },
    };
}

// ============================================================
// Main Export Function
// ============================================================

/**
 * Extract clauses from a DOCX buffer
 */
export async function extractClausesFromDocx(
    docxBuffer: Buffer,
    options: {
        minClauseLength?: number;
        maxClauseLength?: number;
        mergeShortClauses?: boolean;
    } = {}
): Promise<ExtractionResult> {
    const {
        minClauseLength = 50,
        maxClauseLength = 10000,
        mergeShortClauses = true,
    } = options;

    // Extract paragraphs with structure
    const paragraphs = await extractParagraphs(docxBuffer);

    // Build full document text
    const documentText = paragraphs.map(p => p.text).join('\n');

    // Group into clauses
    let clauses = groupIntoClauses(paragraphs);

    // Filter and merge based on options
    if (mergeShortClauses) {
        clauses = mergeTooShortClauses(clauses, minClauseLength);
    }

    // Filter out clauses that are too short or too long
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
        document_text: documentText,
        clauses,
        metadata: {
            total_paragraphs: paragraphs.length,
            total_characters: documentText.length,
            extraction_method: 'structural_heading_detection',
        },
    };
}

/**
 * Merge clauses that are too short into previous clause
 */
function mergeTooShortClauses(
    clauses: ExtractedClause[],
    minLength: number
): ExtractedClause[] {
    const result: ExtractedClause[] = [];

    for (const clause of clauses) {
        if (clause.clause_text.length < minLength && result.length > 0) {
            // Merge with previous
            const prev = result[result.length - 1];
            prev.clause_text += '\n' + clause.clause_text;
            prev.offsets.end = clause.offsets.end;
            prev.offsets.paragraph_ids.push(...clause.offsets.paragraph_ids);
        } else {
            result.push({ ...clause });
        }
    }

    return result;
}

/**
 * Alternative: Extract using mammoth for simpler text extraction
 */
export async function extractClausesSimple(
    docxBuffer: Buffer
): Promise<ExtractionResult> {
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    const text = result.value;

    // Split by common clause patterns
    const clausePattern = /(?=(?:^|\n)(?:\d+\.|Article|Section|ARTICLE|SECTION)\s)/gm;
    const parts = text.split(clausePattern).filter(p => p.trim());

    let offset = 0;
    const clauses: ExtractedClause[] = parts.map((part, index) => {
        const trimmed = part.trim();
        const heading = trimmed.split('\n')[0].substring(0, 100);
        const startOffset = text.indexOf(trimmed, offset);
        const endOffset = startOffset + trimmed.length;
        offset = endOffset;

        return {
            clause_id: generateClauseId(heading, index + 1),
            sequence_number: index + 1,
            heading: heading.length < 100 ? heading : null,
            clause_text: trimmed,
            offsets: {
                start: startOffset,
                end: endOffset,
                paragraph_ids: [`simple_${index}`],
            },
        };
    });

    return {
        document_text: text,
        clauses,
        metadata: {
            total_paragraphs: parts.length,
            total_characters: text.length,
            extraction_method: 'simple_pattern_split',
        },
    };
}

// ============================================================
// Utility: Embedding Preparation
// ============================================================

/**
 * Prepare clause text for embedding
 */
export function prepareForEmbedding(clause: ExtractedClause): string {
    // Include heading context for better semantic matching
    const prefix = clause.heading ? `[${clause.heading}] ` : '';
    return prefix + clause.clause_text;
}

/**
 * Chunk long clauses for embedding
 */
export function chunkClause(
    clause: ExtractedClause,
    maxChunkSize: number = 1000,
    overlap: number = 100
): string[] {
    const text = prepareForEmbedding(clause);

    if (text.length <= maxChunkSize) {
        return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + maxChunkSize, text.length);
        chunks.push(text.substring(start, end));
        start = end - overlap;
        if (start >= text.length - overlap) break;
    }

    return chunks;
}
