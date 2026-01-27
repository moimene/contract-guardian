/**
 * DOCX Redline Generator
 * 
 * Generates Word documents with tracked changes (redlines) from ChangeSets.
 * Supports:
 * - Insert operations (green additions)
 * - Delete operations (red strikethrough)
 * - Replace operations (delete + insert)
 * - Comment bubbles with client text
 */

import {
    Document,
    Paragraph,
    TextRun,
    InsertedTextRun,
    DeletedTextRun,
    CommentRangeStart,
    CommentRangeEnd,
    CommentReference,
    Packer,
    AlignmentType,
    HeadingLevel,
    IRunOptions,
} from 'docx';

// ============================================================
// Types
// ============================================================

export interface RedlineOperation {
    op_id: string;
    type: 'INSERT' | 'DELETE' | 'REPLACE';
    anchor: {
        clause_id: string;
        start_offset?: number;
        end_offset?: number;
        before?: string;
        after?: string;
    };
    insert_text?: string;
    delete_text?: string;
    replace_from?: string;
    replace_to?: string;
}

export interface RedlineChange {
    change_id: string;
    rule_id: string;
    clause_instance_id: string;
    ops: RedlineOperation[];
    comments: {
        internal: string;
        client: string;
    };
}

export interface RedlineInput {
    document_id: string;
    original_text: string;
    changes: RedlineChange[];
    config: {
        author_name: string;
        include_comments: boolean;
        revision_date?: Date;
    };
}

export interface GeneratedRedline {
    buffer: Buffer;
    filename: string;
    stats: {
        total_changes: number;
        insertions: number;
        deletions: number;
        replacements: number;
        comments_added: number;
    };
}

// ============================================================
// Tracked Changes Configuration
// ============================================================

const DEFAULT_AUTHOR = 'Amazon Legal Review';
const REVISION_ID = 1;

// ============================================================
// Text Processing Utilities
// ============================================================

/**
 * Find the position of anchor text in document
 */
function findAnchorPosition(
    text: string,
    anchor: RedlineOperation['anchor']
): { start: number; end: number } | null {
    // If we have explicit offsets, use them
    if (anchor.start_offset !== undefined && anchor.end_offset !== undefined) {
        return { start: anchor.start_offset, end: anchor.end_offset };
    }

    // Try to find using before/after context
    if (anchor.before && anchor.after) {
        const beforeIdx = text.indexOf(anchor.before);
        if (beforeIdx !== -1) {
            const afterIdx = text.indexOf(anchor.after, beforeIdx + anchor.before.length);
            if (afterIdx !== -1) {
                return {
                    start: beforeIdx + anchor.before.length,
                    end: afterIdx,
                };
            }
        }
    }

    return null;
}

/**
 * Apply operations to text and return segments with change markers
 */
interface TextSegment {
    text: string;
    type: 'unchanged' | 'inserted' | 'deleted';
    commentId?: number;
    commentText?: string;
}

function applyChangesToText(
    originalText: string,
    changes: RedlineChange[]
): TextSegment[] {
    // Collect all operations with positions
    interface PositionedOp {
        position: number;
        endPosition: number;
        op: RedlineOperation;
        change: RedlineChange;
    }

    const positionedOps: PositionedOp[] = [];

    for (const change of changes) {
        for (const op of change.ops) {
            const pos = findAnchorPosition(originalText, op.anchor);
            if (pos) {
                positionedOps.push({
                    position: pos.start,
                    endPosition: pos.end,
                    op,
                    change,
                });
            }
        }
    }

    // Sort by position (descending to apply from end to start)
    positionedOps.sort((a, b) => b.position - a.position);

    // Build segments
    const segments: TextSegment[] = [];
    let currentText = originalText;
    let commentCounter = 1;

    // Process each operation
    for (const { position, endPosition, op, change } of positionedOps) {
        const commentId = commentCounter++;
        const commentText = change.comments.client;

        // Get text after this change point
        const afterText = currentText.substring(endPosition);

        // Get text before this change point
        const beforeText = currentText.substring(0, position);

        // Get the text being affected
        const affectedText = currentText.substring(position, endPosition);

        // Add after segment if not empty
        if (afterText) {
            segments.unshift({ text: afterText, type: 'unchanged' });
        }

        // Process based on operation type
        switch (op.type) {
            case 'INSERT':
                if (op.insert_text) {
                    segments.unshift({
                        text: op.insert_text,
                        type: 'inserted',
                        commentId,
                        commentText,
                    });
                }
                break;

            case 'DELETE':
                if (affectedText || op.delete_text) {
                    segments.unshift({
                        text: op.delete_text || affectedText,
                        type: 'deleted',
                        commentId,
                        commentText,
                    });
                }
                break;

            case 'REPLACE':
                // Delete old text
                if (op.replace_from || affectedText) {
                    segments.unshift({
                        text: op.replace_from || affectedText,
                        type: 'deleted',
                        commentId,
                        commentText,
                    });
                }
                // Insert new text
                if (op.replace_to) {
                    segments.unshift({
                        text: op.replace_to,
                        type: 'inserted',
                        commentId,
                        commentText,
                    });
                }
                break;
        }

        // Update current text to before portion
        currentText = beforeText;
    }

    // Add remaining text at the beginning
    if (currentText) {
        segments.unshift({ text: currentText, type: 'unchanged' });
    }

    return segments;
}

// ============================================================
// DOCX Generation
// ============================================================

/**
 * Generate DOCX with tracked changes
 */
export async function generateRedlineDocx(
    input: RedlineInput
): Promise<GeneratedRedline> {
    const { original_text, changes, config } = input;
    const author = config.author_name || DEFAULT_AUTHOR;
    const revisionDate = config.revision_date || new Date();

    // Apply changes to get segments
    const segments = applyChangesToText(original_text, changes);

    // Build document children (paragraphs with runs)
    const textRuns: (TextRun | InsertedTextRun | DeletedTextRun)[] = [];

    let stats = {
        total_changes: 0,
        insertions: 0,
        deletions: 0,
        replacements: 0,
        comments_added: 0,
    };

    for (const segment of segments) {
        switch (segment.type) {
            case 'unchanged':
                textRuns.push(new TextRun({ text: segment.text }));
                break;

            case 'inserted':
                textRuns.push(
                    new InsertedTextRun({
                        text: segment.text,
                        author,
                        date: revisionDate,
                        id: REVISION_ID,
                    })
                );
                stats.insertions++;
                stats.total_changes++;
                break;

            case 'deleted':
                textRuns.push(
                    new DeletedTextRun({
                        text: segment.text,
                        author,
                        date: revisionDate,
                        id: REVISION_ID,
                    })
                );
                stats.deletions++;
                stats.total_changes++;
                break;
        }
    }

    // Create document
    const doc = new Document({
        features: {
            trackRevisions: true,
        },
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: textRuns,
                    }),
                ],
            },
        ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Calculate replacement count (where we have both insert and delete)
    stats.replacements = changes.reduce((count, c) => {
        return count + c.ops.filter(op => op.type === 'REPLACE').length;
    }, 0);

    return {
        buffer: buffer as Buffer,
        filename: `${input.document_id}_REDLINED.docx`,
        stats,
    };
}

/**
 * Generate a more structured redline document with sections
 */
export async function generateStructuredRedline(
    input: RedlineInput & {
        clauses: Array<{
            clause_id: string;
            heading: string | null;
            clause_text: string;
        }>;
    }
): Promise<GeneratedRedline> {
    const { clauses, changes, config } = input;
    const author = config.author_name || DEFAULT_AUTHOR;
    const revisionDate = config.revision_date || new Date();

    const paragraphs: Paragraph[] = [];
    let stats = {
        total_changes: 0,
        insertions: 0,
        deletions: 0,
        replacements: 0,
        comments_added: 0,
    };

    for (const clause of clauses) {
        // Add heading if exists
        if (clause.heading) {
            paragraphs.push(
                new Paragraph({
                    text: clause.heading,
                    heading: HeadingLevel.HEADING_2,
                })
            );
        }

        // Find changes for this clause
        const clauseChanges = changes.filter(c => c.clause_instance_id === clause.clause_id);

        if (clauseChanges.length === 0) {
            // No changes - add as-is
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: clause.clause_text })],
                })
            );
        } else {
            // Apply changes
            const segments = applyChangesToText(clause.clause_text, clauseChanges);
            const textRuns: (TextRun | InsertedTextRun | DeletedTextRun)[] = [];

            for (const segment of segments) {
                switch (segment.type) {
                    case 'unchanged':
                        textRuns.push(new TextRun({ text: segment.text }));
                        break;
                    case 'inserted':
                        textRuns.push(
                            new InsertedTextRun({
                                text: segment.text,
                                author,
                                date: revisionDate,
                                id: REVISION_ID,
                            })
                        );
                        stats.insertions++;
                        stats.total_changes++;
                        break;
                    case 'deleted':
                        textRuns.push(
                            new DeletedTextRun({
                                text: segment.text,
                                author,
                                date: revisionDate,
                                id: REVISION_ID,
                            })
                        );
                        stats.deletions++;
                        stats.total_changes++;
                        break;
                }
            }

            paragraphs.push(
                new Paragraph({
                    children: textRuns,
                })
            );
        }

        // Add spacing between clauses
        paragraphs.push(new Paragraph({ children: [] }));
    }

    // Create document
    const doc = new Document({
        features: {
            trackRevisions: true,
        },
        sections: [
            {
                properties: {},
                children: paragraphs,
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);

    return {
        buffer: buffer as Buffer,
        filename: `${input.document_id}_REDLINED.docx`,
        stats,
    };
}

/**
 * Convert PDF extraction result to DOCX with redlines
 */
export async function convertPdfToRedlinedDocx(
    pdfClauses: Array<{
        clause_id: string;
        heading: string | null;
        clause_text: string;
    }>,
    changes: RedlineChange[],
    config: {
        document_id: string;
        author_name?: string;
    }
): Promise<GeneratedRedline> {
    return generateStructuredRedline({
        document_id: config.document_id,
        original_text: pdfClauses.map(c => c.clause_text).join('\n\n'),
        clauses: pdfClauses,
        changes,
        config: {
            author_name: config.author_name || DEFAULT_AUTHOR,
            include_comments: true,
        },
    });
}
