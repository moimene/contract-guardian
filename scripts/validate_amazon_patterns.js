/**
 * CG-008.P: Validate Keyword Patterns Against Amazon PSA Reference
 * 
 * Extracts sections from the Amazon PSA Fallback Guide and tests 
 * each section against our keyword patterns.
 * 
 * Run: node scripts/validate_amazon_patterns.js
 */

const { execSync } = require('child_process');
const path = require('path');

// Extract document text
const docPath = path.join(__dirname, '../contratos de test/PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx');
let docText;
try {
    docText = execSync(`textutil -convert txt -stdout "${docPath}"`, { encoding: 'utf8' });
} catch (e) {
    console.error('Error extracting document:', e.message);
    process.exit(1);
}

// Split into sections (bullet points starting with •)
const sections = docText.split(/\n\s*•\s+/).filter(s => s.trim().length > 50);

console.log('CG-008.P: Pattern Validation Against Amazon PSA Reference');
console.log('==========================================================');
console.log(`Total sections found: ${sections.length}`);
console.log('');

// Define patterns (subset from keyword_router)
const KEYWORD_PATTERNS = {
    DataProtection: {
        patterns: [
            /\bGDPR\b/i,
            /General\s+Data\s+Protection\s+Regulation/i,
            /data\s+protection\s+legislation/i,
            /data\s+controllers?/i,
            /personal\s+data/i,
            /privacy\s+notice/i,
            /data\s+subject/i
        ]
    },
    GoverningLaw: {
        patterns: [
            /governed.*laws\s+of/i,
            /laws\s+of\s+(the\s+State\s+of\s+)?California/i,
            /laws\s+of\s+(the\s+State\s+of\s+)?New\s+York/i,
            /exclusive\s+jurisdiction/i,
            /venue/i
        ]
    },
    DisputeResolution: {
        patterns: [
            /binding\s+arbitration/i,
            /JAMS/i,
            /arbitration/i,
            /mediation/i,
            /jury\s+trial/i
        ]
    },
    IndemnityProdCo: {
        patterns: [
            /ProdCo\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /indemnify.*Amazon/i,
            /Amazon\s+Indemnitees/i,
            /hold\s+Amazon\s+harmless/i
        ]
    },
    IndemnityAmazon: {
        patterns: [
            /Amazon\s+(shall|will)\s+indemnify/i,
            /indemnify\s+ProdCo/i
        ]
    },
    LiabilityLimitation: {
        patterns: [
            /IN\s+NO\s+EVENT\s+SHALL/i,
            /CONSEQUENTIAL\s+DAMAGES/i,
            /INDIRECT\s+DAMAGES/i,
            /AGGREGATE\s+LIABILITY/i,
            /SHALL\s+NOT\s+EXCEED/i,
            /limitation\s+of\s+liability/i
        ]
    },
    ForceMajeure: {
        patterns: [
            /force\s+majeure/i,
            /acts?\s+of\s+God/i,
            /beyond\s+reasonable\s+control/i
        ]
    },
    Confidentiality: {
        patterns: [
            /confidential\s+information/i,
            /non-disclosure/i,
            /keep\s+confidential/i,
            /shall\s+not\s+disclose/i
        ]
    },
    Assignment: {
        patterns: [
            /may\s+not\s+assign/i,
            /successors\s+and\s+assigns/i,
            /assignment/i
        ]
    },
    Insurance: {
        patterns: [
            /insurance/i,
            /E\s*&\s*O/i,
            /errors\s+and\s+omissions/i
        ]
    },
    RightsGrant: {
        patterns: [
            /grants?\s+to\s+Amazon/i,
            /all\s+rights/i,
            /in\s+perpetuity/i,
            /throughout\s+the\s+universe/i
        ]
    },
    TerminationRights: {
        patterns: [
            /may\s+terminate/i,
            /right\s+to\s+terminate/i,
            /terminate\s+this\s+Agreement/i
        ]
    },
    PaymentCredits: {
        patterns: [
            /Amazon\s+(shall|will)\s+pay/i,
            /payment/i,
            /payable/i,
            /fee/i
        ]
    },
    AuditRights: {
        patterns: [
            /audit/i,
            /books\s+and\s+records/i,
            /inspect/i
        ]
    },
    ServicesScope: {
        patterns: [
            /production\s+services/i,
            /ProdCo\s+(shall|will)\s+provide/i,
            /deliverables/i
        ]
    },
    Publicity: {
        patterns: [
            /publicity/i,
            /press\s+release/i
        ]
    },
    RepsProdCo: {
        patterns: [
            /ProdCo\s+represents/i,
            /ProdCo\s+warrants/i
        ]
    },
    AmazonControl: {
        patterns: [
            /Amazon['']?s\s+sole\s+discretion/i,
            /final\s+cut/i,
            /creative\s+control/i
        ]
    }
};

// Function to detect family
function detectFamily(text) {
    const results = [];

    for (const [family, config] of Object.entries(KEYWORD_PATTERNS)) {
        let matchCount = 0;
        let matchedPatterns = [];

        for (const pattern of config.patterns) {
            if (pattern.test(text)) {
                matchCount++;
                matchedPatterns.push(pattern.toString().slice(0, 30));
            }
        }

        if (matchCount > 0) {
            results.push({ family, matchCount, matchedPatterns });
        }
    }

    results.sort((a, b) => b.matchCount - a.matchCount);
    return results;
}

// Analyze each section
console.log('Section Analysis:');
console.log('-----------------');

const sectionResults = [];

sections.forEach((section, idx) => {
    // Extract heading (first line or first N chars)
    const heading = section.split(':')[0].substring(0, 50).trim();
    const results = detectFamily(section);

    if (results.length > 0) {
        const topMatch = results[0];
        console.log(`\n[${idx + 1}] ${heading}`);
        console.log(`    → ${topMatch.family} (${topMatch.matchCount} matches)`);
        console.log(`    Patterns: ${topMatch.matchedPatterns.slice(0, 2).join(', ')}`);

        sectionResults.push({
            heading,
            detected: topMatch.family,
            matches: topMatch.matchCount,
            alternatives: results.slice(1, 3).map(r => r.family)
        });
    } else {
        console.log(`\n[${idx + 1}] ${heading}`);
        console.log(`    → ⚠️ NO MATCH`);

        sectionResults.push({
            heading,
            detected: 'OtherUnknown',
            matches: 0,
            alternatives: []
        });
    }
});

// Summary
console.log('\n\n=== SUMMARY ===');
console.log(`Total sections: ${sectionResults.length}`);

const matched = sectionResults.filter(r => r.detected !== 'OtherUnknown');
const unmatched = sectionResults.filter(r => r.detected === 'OtherUnknown');

console.log(`Matched: ${matched.length} (${Math.round(matched.length / sectionResults.length * 100)}%)`);
console.log(`Unmatched: ${unmatched.length}`);

if (unmatched.length > 0) {
    console.log('\nUnmatched sections:');
    unmatched.forEach(u => console.log(`  - ${u.heading}`));
}

// Family distribution
console.log('\nFamily distribution:');
const familyCounts = {};
matched.forEach(m => {
    familyCounts[m.detected] = (familyCounts[m.detected] || 0) + 1;
});
Object.entries(familyCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([family, count]) => console.log(`  ${family}: ${count}`));
