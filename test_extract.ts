/**
 * Test Script - Extract clauses from local DOCX
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractClausesFromDocx } from './extractors/docx_clause_extractor';

async function main() {
    const testFile = path.join(__dirname, 'contratos de test', 'PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx');

    console.log('📄 Loading file:', testFile);

    if (!fs.existsSync(testFile)) {
        console.error('❌ File not found:', testFile);
        process.exit(1);
    }

    const buffer = fs.readFileSync(testFile);
    console.log('📊 File size:', buffer.length, 'bytes');

    console.log('\n🔍 Extracting clauses...\n');

    try {
        const result = await extractClausesFromDocx(buffer, {
            minClauseLength: 30,
            maxClauseLength: 15000,
        });

        console.log('✅ Extraction complete!\n');
        console.log('📈 Metadata:');
        console.log('   - Total paragraphs:', result.metadata.total_paragraphs);
        console.log('   - Total characters:', result.metadata.total_characters);
        console.log('   - Extraction method:', result.metadata.extraction_method);
        console.log('   - Clauses found:', result.clauses.length);

        console.log('\n📋 Clauses:\n');

        for (const clause of result.clauses) {
            console.log(`[${clause.sequence_number}] ${clause.clause_id}`);
            console.log(`    Heading: ${clause.heading || '(none)'}`);
            console.log(`    Text preview: ${clause.clause_text.substring(0, 100)}...`);
            console.log(`    Offsets: ${clause.offsets.start}-${clause.offsets.end}`);
            console.log(`    Paragraph IDs: ${clause.offsets.paragraph_ids?.length || 0}`);
            console.log('');
        }

        // Save results to JSON for inspection
        const outputPath = path.join(__dirname, 'test_extraction_result.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log('💾 Results saved to:', outputPath);

    } catch (error) {
        console.error('❌ Extraction failed:', error);
        process.exit(1);
    }
}

main();
