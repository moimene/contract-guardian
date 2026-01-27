/**
 * generate_redline.js
 * Script para generar DOCX redlineado usando Aspose Words Cloud
 * Se llama desde n8n o directamente para exportar contratos con track changes
 * 
 * Usage:
 *   node scripts/generate_redline.js --run-id=<uuid>
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const AsposeWords = require('asposewordscloud');
const fs = require('fs');
const path = require('path');

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Aspose Words client
const wordsConfig = new AsposeWords.Configuration({
    clientId: process.env.ASPOSE_CLIENT_ID,
    clientSecret: process.env.ASPOSE_CLIENT_SECRET
});
const wordsApi = new AsposeWords.WordsApi(wordsConfig);

/**
 * Apply proposed changes to document text
 */
function applyChanges(originalText, proposedChanges) {
    if (!proposedChanges || !proposedChanges.redline) {
        return originalText;
    }
    // proposed_changes.redline contains the modified text
    return proposedChanges.redline;
}

/**
 * Generate a simple DOCX with the given text
 */
function createSimpleDocx(text, title = 'Document') {
    // For simplicity, create a minimal DOCX structure
    // In production, use docx library or load template
    const docxHeader = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>`;
    const docxFooter = `</w:body></w:document>`;

    const paragraphs = text.split('\n').map(p =>
        `<w:p><w:r><w:t>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t></w:r></w:p>`
    ).join('');

    return docxHeader + paragraphs + docxFooter;
}

async function generateRedline(runId) {
    console.log(`\n🔄 Generating redline for run: ${runId}\n`);

    // 1. Get run and document info
    const { data: run, error: runError } = await supabase
        .from('contract_runs')
        .select('run_id, document_id, status, decision')
        .eq('run_id', runId)
        .single();

    if (runError || !run) {
        throw new Error(`Run not found: ${runId}`);
    }

    console.log(`📄 Document ID: ${run.document_id}`);

    // 2. Get document from storage
    const { data: doc } = await supabase
        .from('documents')
        .select('file_name, storage_path, file_type')
        .eq('document_id', run.document_id)
        .single();

    if (!doc) {
        throw new Error('Document not found');
    }

    console.log(`📁 File: ${doc.file_name}`);

    // 3. Download original document
    const { data: originalBlob, error: downloadError } = await supabase
        .storage
        .from('contracts')
        .download(doc.storage_path);

    if (downloadError) {
        throw new Error(`Failed to download: ${downloadError.message}`);
    }

    const originalBuffer = Buffer.from(await originalBlob.arrayBuffer());
    console.log(`📥 Downloaded ${originalBuffer.length} bytes`);

    // 4. Get clause reviews with proposed changes
    const { data: reviews } = await supabase
        .from('clause_reviews')
        .select('clause_text, proposed_changes, heading, sequence_number, client_state')
        .eq('run_id', runId)
        .order('sequence_number');

    console.log(`📋 Found ${reviews?.length || 0} clause reviews`);

    // 5. Build revised document with changes applied
    let hasChanges = false;
    const revisedClauses = [];

    for (const review of (reviews || [])) {
        if (review.client_state === 'accepted' && review.proposed_changes?.redline) {
            // Use the accepted redline version
            revisedClauses.push({
                original: review.clause_text,
                revised: review.proposed_changes.redline,
                heading: review.heading
            });
            hasChanges = true;
        } else {
            // Keep original
            revisedClauses.push({
                original: review.clause_text,
                revised: review.clause_text,
                heading: review.heading
            });
        }
    }

    console.log(`✏️ Changes to apply: ${revisedClauses.filter(c => c.original !== c.revised).length}`);

    if (!hasChanges) {
        console.log('ℹ️ No accepted changes to apply. Returning original document.');
        // Upload original as "reviewed" version
        const outputPath = `exports/${runId}_REVIEWED.docx`;
        await supabase.storage.from('contracts').upload(outputPath, originalBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: true
        });

        const { data: signedUrl } = await supabase.storage
            .from('contracts')
            .createSignedUrl(outputPath, 3600);

        return {
            success: true,
            run_id: runId,
            download_url: signedUrl?.signedUrl,
            filename: doc.file_name.replace(/\.[^.]+$/, '') + '_REVIEWED.docx',
            changes_applied: 0
        };
    }

    // 6. Create revised document content
    const originalText = revisedClauses.map(c => `${c.heading || ''}\n${c.original}`).join('\n\n');
    const revisedText = revisedClauses.map(c => `${c.heading || ''}\n${c.revised}`).join('\n\n');

    // 7. Upload both to Aspose for comparison
    const timestamp = Date.now();
    const originalPath = `temp/original_${runId}_${timestamp}.docx`;
    const revisedPath = `temp/revised_${runId}_${timestamp}.docx`;
    const resultPath = `temp/compared_${runId}_${timestamp}.docx`;

    try {
        // Upload original
        await wordsApi.uploadFile(new AsposeWords.UploadFileRequest({
            fileContent: originalBuffer,
            path: originalPath
        }));
        console.log(`📤 Uploaded original to Aspose`);

        // Create and upload revised document
        // For now, we'll create a simple text-based comparison
        // In production, use proper DOCX manipulation

        // 8. Use Aspose Compare
        const compareData = new AsposeWords.CompareData({
            author: 'Contract Guardian',
            dateTime: new Date(),
            comparingWithDocument: revisedPath,
            resultDocumentFormat: 'Docx'
        });

        const compareRequest = new AsposeWords.CompareDocumentRequest({
            name: originalPath,
            compareData: compareData,
            destFileName: resultPath
        });

        await wordsApi.compareDocument(compareRequest);
        console.log(`📊 Comparison completed`);

        // 9. Download result
        const downloadResult = await wordsApi.downloadFile(
            new AsposeWords.DownloadFileRequest({ path: resultPath })
        );
        const resultBuffer = downloadResult.body;
        console.log(`📥 Downloaded compared document: ${resultBuffer.length} bytes`);

        // 10. Upload to Supabase storage
        const outputPath = `exports/${runId}_REDLINED.docx`;
        await supabase.storage.from('contracts').upload(outputPath, resultBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: true
        });

        // 11. Get signed URL
        const { data: signedUrl } = await supabase.storage
            .from('contracts')
            .createSignedUrl(outputPath, 3600);

        // 12. Cleanup Aspose temp files
        await Promise.all([
            wordsApi.deleteFile(new AsposeWords.DeleteFileRequest({ path: originalPath })),
            wordsApi.deleteFile(new AsposeWords.DeleteFileRequest({ path: revisedPath })),
            wordsApi.deleteFile(new AsposeWords.DeleteFileRequest({ path: resultPath }))
        ]).catch(() => { }); // Ignore cleanup errors

        console.log(`\n✅ Redline generated successfully!`);
        console.log(`📎 Download URL: ${signedUrl?.signedUrl}`);

        return {
            success: true,
            run_id: runId,
            download_url: signedUrl?.signedUrl,
            filename: doc.file_name.replace(/\.[^.]+$/, '') + '_REDLINED.docx',
            changes_applied: revisedClauses.filter(c => c.original !== c.revised).length
        };

    } catch (asposeError) {
        console.error('❌ Aspose error:', asposeError.message);

        // Fallback: return original with metadata
        const outputPath = `exports/${runId}_REVIEWED.docx`;
        await supabase.storage.from('contracts').upload(outputPath, originalBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: true
        });

        const { data: signedUrl } = await supabase.storage
            .from('contracts')
            .createSignedUrl(outputPath, 3600);

        return {
            success: true,
            run_id: runId,
            download_url: signedUrl?.signedUrl,
            filename: doc.file_name.replace(/\.[^.]+$/, '') + '_REVIEWED.docx',
            changes_applied: 0,
            warning: 'Track changes not available, returning reviewed document'
        };
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const runIdArg = args.find(a => a.startsWith('--run-id='));

    if (!runIdArg) {
        console.error('Usage: node scripts/generate_redline.js --run-id=<uuid>');
        process.exit(1);
    }

    const runId = runIdArg.split('=')[1];

    generateRedline(runId)
        .then(result => {
            console.log('\n📦 Result:', JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Error:', err.message);
            process.exit(1);
        });
}

module.exports = { generateRedline };
