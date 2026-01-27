/**
 * Generate Embeddings for Policy Examples
 * Uses OpenAI text-embedding-3-small model
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize clients
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const BATCH_SIZE = 50;
const DELAY_MS = 500;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateEmbeddings() {
    console.log('🚀 Starting embedding generation...\n');

    let totalProcessed = 0;
    let batchNum = 0;

    while (true) {
        batchNum++;

        // Get pending examples
        const { data: pending, error: fetchError } = await supabase
            .from('policy_examples')
            .select('id, example_text')
            .is('embedding', null)
            .limit(BATCH_SIZE);

        if (fetchError) {
            console.error('❌ Error fetching pending:', fetchError.message);
            break;
        }

        if (!pending || pending.length === 0) {
            console.log('\n✅ All embeddings generated!');
            break;
        }

        console.log(`\n📦 Batch ${batchNum}: Processing ${pending.length} examples...`);

        for (let i = 0; i < pending.length; i++) {
            const item = pending[i];

            try {
                // Generate embedding
                const response = await openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: item.example_text,
                    dimensions: 1536
                });

                const embedding = response.data[0].embedding;

                // Update in database
                const { error: updateError } = await supabase
                    .from('policy_examples')
                    .update({ embedding: embedding })
                    .eq('id', item.id);

                if (updateError) {
                    console.error(`  ❌ Error updating ${item.id}:`, updateError.message);
                } else {
                    totalProcessed++;
                    process.stdout.write(`\r  ✓ Processed ${i + 1}/${pending.length} (Total: ${totalProcessed})`);
                }

                // Small delay to avoid rate limits
                await sleep(50);

            } catch (error) {
                console.error(`\n  ❌ Error for ${item.id}:`, error.message);
            }
        }

        console.log(''); // New line after batch

        // Check progress
        const { data: stats } = await supabase
            .from('policy_examples_embedding_stats')
            .select('*')
            .single();

        if (stats) {
            console.log(`  📊 Progress: ${stats.with_embedding}/${stats.total} (${stats.percent_complete}%)`);
        }

        // Delay between batches
        await sleep(DELAY_MS);
    }

    console.log(`\n🎉 Total processed: ${totalProcessed} embeddings`);
}

// Run
generateEmbeddings()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
